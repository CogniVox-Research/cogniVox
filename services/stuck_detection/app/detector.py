import datetime

import spacy
from fastapi.logger import logger

from app import config, dto
from app.dto import ASRData, Silence
from app.util import spacy_load_or_download


class StuckDetector:
    def __init__(self) -> None:
        self.model = spacy_load_or_download("en_core_web_md")
        self.detections = {}

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
                return dto.UnstuckDetection(stuck_id="PLACEHOLDER")
            return None

        if data.session_id in self.detections:
            if not self.detections[data.session_id]:
                logger.debug("Generating suggestions")

                # from . import llm_server
                # suggestions = await llm_server.get_continue_for(data.session_id, data.full_text)

                suggestion = "test"

                # suggestion generation
                self.detections[data.session_id] = True
                return dto.StuckDetection(
                    reason="repetition" if is_repeating else "silence",
                    suggestions=[suggestion],
                )

        else:
            self.detections[data.session_id] = False
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
