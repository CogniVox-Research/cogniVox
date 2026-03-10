import asyncio

import httpx
from fastapi.logger import logger
from shared.store import connect_store

from app import config, dto
from app.dto import ASRData, Silence
from app.util import spacy_load_or_download

store = connect_store(config.store)


class Task:
    def __init__(self) -> None:
        self.lock = asyncio.Lock()
        self.complete = False


class StuckDetector:
    def __init__(self) -> None:
        self.model = spacy_load_or_download("en_core_web_md")
        self.detections: dict[str, Task] = {}

    async def detect_stuck(self, data: ASRData):
        has_spoken = data.full_text != ""
        if not has_spoken:
            # has not talked, skip processing
            return None

        is_repeating = self._detect_semantic_repetition(data.full_text)
        has_long_silence = self._detect_long_silence(data)

        if not is_repeating and not has_long_silence:
            was_stuck = self.detections.pop(data.session_id, None) is not None
            if was_stuck:
                return dto.UnstuckDetection()
            return None

        if data.session_id in self.detections:
            task = self.detections[data.session_id]
            await task.lock.acquire()
            try:
                if not task.complete:
                    logger.error("Generating suggestions")

                    try:
                        expected_speech = store.get(
                            f"{data.session_id}/documents/content"
                        ).decode("utf-8")
                    except:
                        expected_speech = """This is the Micro Machine Man presenting the most midget miniature motorcade of Micro Machines. Each one has dramatic details, terrific trims, precision paint jobs,
                            plus incredible Micro Machine Pocket play sets. There's a police station, fire station, restaurant, service station, and more. Perfect pocket portables to take any place.
                            And there are many miniature play sets to play with and each one comes with its own special edition Micro Machine vehicle and fun, fantastic features that miraculously move.
                            Raise the boat lift at the airport marina, man the gun turret at the army base, clean your car at the car wash, raise the toll bridge. And these play sets fit together to
                            form a Micro Machine world. Micro Machine Pocket play sets, so tremendously tiny, so perfectly precise, so dazzlingly detailed, you'll want to pocket them all.
                            Micro Machines and Micro Machine Pocket play sets sold separately from Galoob. The smaller they are, the better they are"""

                    delivered_speech = data.full_text
                    payload = {
                        "full_speech": expected_speech,
                        "delivered_so_far": delivered_speech,
                    }

                    async with httpx.AsyncClient(timeout=30) as client:
                        response = await client.post(
                            config.llm_continue_url, json=payload
                        )

                    response_data = response.json()
                    logger.error(f"Got from LLM: {response_data}")

                    suggestion = response_data.get("continuation_hint")

                    # suggestion generation
                    task.complete = True
                    return dto.StuckDetection(
                        reason="repetition" if is_repeating else "silence",
                        suggestion=suggestion,
                    )
            finally:
                task.lock.release()
        else:
            self.detections[data.session_id] = Task()
            return dto.StuckDetection(
                reason="repetition" if is_repeating else "silence",
            )

    def _detect_semantic_repetition(self, text: str):
        doc = self.model(text)
        sentences = [sentence for sentence in doc.sents]
        if len(sentences) > config.checked_sentences:
            sentences = sentences[len(sentences) - config.checked_sentences :]

        repeated_pairs = []

        for i in range(len(sentences)):
            for j in range(i + 1, len(sentences)):
                s1 = sentences[i]
                s2 = sentences[j]

                # Calculate cosine similarity
                similarity = s1.similarity(s2)
                if similarity >= config.sentence_similarity_threshold:
                    repeated_pairs.append((s1.text, s2.text, similarity))

        logger.info(f"Semantic similarity result: {repeated_pairs}")

        return len(repeated_pairs) > config.repeated_sentence_threshold

    def _detect_long_silence(self, data: ASRData):
        last_line = data.lines[-1]
        if not isinstance(last_line, Silence):
            logger.info("No pause detected")
            return False

        if not last_line.timestamp.duration > config.max_silence:
            logger.info(
                f"Pause is lower than min threshold {last_line.timestamp.duration} < {config.max_silence}"
            )
            return False

        return True


detector = StuckDetector()
