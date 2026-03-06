###########################################################
from pathlib import Path

import nltk

from app.util import is_out_of_memory

download_dir = Path(__file__).parent.parent / "models"
download_dir.mkdir(exist_ok=True, parents=True)

nltk.download("punkt", download_dir, quiet=True)
nltk.download("punkt_tab", download_dir, quiet=True)
nltk.data.path.append(str(download_dir))

from typing import List, Tuple

import nltk
import numpy as np
from sentence_transformers import SentenceTransformer, util
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity

# ------------------------------------------
# CONFIGURATION
# ------------------------------------------
MODEL_NAME = "all-MiniLM-L6-v2"

# Thresholds
MISSING_THRESHOLD = 0.65
PARAPHRASE_STRONG = 0.75
PARAPHRASE_MILD = 0.85
KEY_POINTS_COUNT = 3


# ============================================================
#                     MAIN COMPARISON CLASS
# ============================================================


class SpeechComparer:
    """Advanced NLP system for comparing delivered speech with transcript."""

    def __init__(self, model_name: str = MODEL_NAME):
        try:
            self.model = SentenceTransformer(model_name, cache_folder=str(download_dir))
        except Exception as e:
            if is_out_of_memory(e):
                print("Not enough cuda memory. Falling back to CPU")
                self.model = SentenceTransformer(
                    model_name,
                    device="cpu",
                    cache_folder=str(download_dir),
                )
            else:
                raise

        print(f"Loaded SBERT model: {model_name}")

    # ---------------------------
    # EMBEDDING
    # ---------------------------
    def _tokenize_and_embed(self, text: str):
        sentences = nltk.sent_tokenize(text)
        embeddings = self.model.encode(sentences, convert_to_numpy=True)
        return sentences, embeddings

    # ============================================================
    # 1. OVERALL SIMILARITY
    # ============================================================
    def get_overall_similarity(self, emb1, emb2):
        avg1 = np.mean(emb1, axis=0, keepdims=True)
        avg2 = np.mean(emb2, axis=0, keepdims=True)
        return float(cosine_similarity(avg1, avg2)[0][0])

    # ============================================================
    # 2. MISSING POINTS
    # ============================================================
    def find_missing_points(self, s1, emb1, emb2):
        sim_matrix = util.cos_sim(emb1, emb2).numpy()
        missing = []

        for i, sent in enumerate(s1):
            best = np.max(sim_matrix[i])
            if best < MISSING_THRESHOLD:
                missing.append((sent, best))

        missing.sort(key=lambda x: x[1])
        return [f"{s} (Sim={score:.4f})" for s, score in missing]

    # ============================================================
    # 3. KEY POINTS (Cluster-Based)
    # ============================================================
    def extract_key_points(self, sentences, embeddings):
        n = len(sentences)
        k = min(KEY_POINTS_COUNT, n)
        if k == 0:
            return []

        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(embeddings)

        key_points = []
        for i in range(k):
            idx = np.where(kmeans.labels_ == i)[0]
            if len(idx) == 0:
                continue

            cluster_emb = embeddings[idx]
            centroid = kmeans.cluster_centers_[i]
            sims = cosine_similarity(cluster_emb, centroid.reshape(1, -1)).flatten()

            best = idx[np.argmax(sims)]
            key_points.append(sentences[best])

        return key_points

    # ============================================================
    # 4. STRUCTURAL ANALYSIS
    # ============================================================
    def structural_analysis(self, sentences):
        word_counts = [len(s.split()) for s in sentences]
        avg_length = np.mean(word_counts)
        lex_density = sum(len(set(s.split())) for s in sentences) / max(
            1, sum(word_counts)
        )

        return {
            "sentence_count": len(sentences),
            "avg_sentence_length": round(avg_length, 2),
            "lexical_density": round(lex_density, 4),
        }

    # ============================================================
    # 5. PARAPHRASE DETECTION
    # ============================================================
    def paraphrase_level(self, score):
        if score > PARAPHRASE_MILD:
            return "Exact or Very Close"
        elif score > PARAPHRASE_STRONG:
            return "Mild Paraphrase"
        elif score > MISSING_THRESHOLD:
            return "Strong Paraphrase"
        else:
            return "Missing"

    # ============================================================
    # 6. SENTENCE-BY-SENTENCE ALIGNMENT
    # ============================================================
    def align_sentences(self, s1, s2, emb1, emb2):
        sim_matrix = util.cos_sim(emb1, emb2).numpy()
        alignments = []

        for i, sent in enumerate(s1):
            best_idx = np.argmax(sim_matrix[i])
            best_sim = sim_matrix[i][best_idx]
            paraphrase_type = self.paraphrase_level(best_sim)

            alignments.append(
                {
                    "transcript_sentence": sent,
                    "closest_speech_sentence": s2[best_idx],
                    "similarity": float(best_sim),
                    "paraphrase_type": paraphrase_type,
                }
            )

        return alignments

    # ============================================================
    # 7. ORDER ANALYSIS
    # ============================================================
    def order_analysis(self, alignments):
        order_list = [a["paraphrase_type"] != "Missing" for a in alignments]
        in_order = sum(order_list)
        total = len(order_list)

        return {
            "in_order_percentage": round(in_order / total * 100, 2),
            "out_of_order_percentage": round(100 - (in_order / total * 100), 2),
        }

    # ============================================================
    # 8. REDUNDANCY CHECK
    # ============================================================
    def redundancy_check(self, sentences, embeddings):
        sim_matrix = util.cos_sim(embeddings, embeddings).numpy()
        threshold = 0.88
        redundant_pairs = []

        for i in range(len(sentences)):
            for j in range(i + 1, len(sentences)):
                if sim_matrix[i][j] > threshold:
                    redundant_pairs.append(
                        (sentences[i], sentences[j], sim_matrix[i][j])
                    )

        return redundant_pairs

    # ============================================================
    # MAIN APPLICATION FUNCTION
    # ============================================================
    def compare(self, transcript: str, speech: str):
        # Embed
        s1, e1 = self._tokenize_and_embed(transcript)
        s2, e2 = self._tokenize_and_embed(speech)

        # Full analysis dictionary
        return {
            "overall_similarity": self.get_overall_similarity(e1, e2),
            "structural_transcript": self.structural_analysis(s1),
            "structural_speech": self.structural_analysis(s2),
            "missing_points": self.find_missing_points(s1, e1, e2),
            "key_points_transcript": self.extract_key_points(s1, e1),
            "key_points_speech": self.extract_key_points(s2, e2),
            "alignment": self.align_sentences(s1, s2, e1, e2),
            "order_analysis": self.order_analysis(self.align_sentences(s1, s2, e1, e2)),
            "redundant_speech_segments": self.redundancy_check(s2, e2),
            "sentence_count_transcript": len(s1),
            "sentence_count_speech": len(s2),
        }


comparer = SpeechComparer()

# ============================================================
#                EXAMPLE APPLICATION USAGE
# ============================================================

# P1 = (
#     "The 2024 annual report highlights strong growth in the technology division, specifically in ERP services. "
#     "Revenue from cloud computing increased by 45% due to strategic partnerships and efficient infrastructure scaling. "
#     "However, the retail sector, a secondary market for the company, saw a modest decline of 5% in year-over-year sales. "
#     "The board is prioritizing the expansion of data centers in Asia next quarter to support the cloud growth. "
#     "Future plans also include a major investment in AI research and development to maintain a competitive edge."
# )

# P2 = (
#     "The company's recent report indicates remarkable progress in its tech wing, with significant revenue from cloud services. "
#     "The company's recent report indicates remarkable progress in its tech wing, with significant revenue from cloud services. "
#     "This surge is attributed to strategic partnerships and robust scaling of IT infrastructure. "
#     "To support this continuous expansion, the executive team is focused on deploying new data centers across Asia in the upcoming quarter. "
#     "A minor decrease in the secondary retail sales area was also noted, but this is not a core concern for the company. "
#     "The firm is also looking at new AI R&D initiatives."
# )

# comparer = SpeechComparer()
# results = comparer.compare(P1, P2)

# print("\n============= RESULTS =============")
# for key, value in results.items():
#     print(f"\n{key.upper()}:\n{value}")
