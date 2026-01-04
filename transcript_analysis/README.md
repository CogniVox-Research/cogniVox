# install dependencies - Demo 
pip install sentence-transformers nltk numpy scikit-learn 


# Transcript Analyzer

**Compare a delivered speech (audio->transcript) with a prepared transcript**

A clear, well-documented README for both non-technical and technical readers describing how to use, configure, and extend the `SpeechComparer` class — a Python-based NLP utility that uses sentence embeddings (Sentence-BERT) to compare a speech transcript and a prepared transcript and produce a structured, explainable comparison report.

---

## Table of Contents

1. [What this does](#what-this-does-plain-language)
2. [High-level overview](#high-level-overview-technical)
3. [Features and outputs](#features-and-outputs)
4. [Quick start](#quick-start-non-technical)
5. [Developer setup](#developer-setup-technical)
6. [Configuration & thresholds](#configuration--thresholds)
7. [How it works — component details](#how-it-works---component-details)
8. [Usage examples](#usage-examples)
9. [Output schema & example result](#output-schema--example-result)
10. [Performance & resource notes](#performance--resource-notes)
11. [Testing & validation](#testing--validation)
12. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## What this does

If you have a prepared script (a transcript) and someone delivers a speech, the `SpeechComparer` helps answer questions like:

- Did the speaker cover the important points?
- Which sentences from the prepared script were missing from the delivered speech?
- Did the speaker paraphrase parts of the script or say them verbatim?
- What are the *key points* in each text? Are they aligned?
- Is the speech long/short or repetitive compared to the script?

You don't need to know machine learning to read the output — the report contains plain text explanations and scores.

---

## High-level overview

`SpeechComparer` uses:

- `nltk` for sentence tokenization.
- `sentence-transformers` (SBERT) for converting sentences into vector embeddings.
- `scikit-learn` for clustering (KMeans) and optional downstream analytics.
- `numpy` for vector math and aggregations.
- `sklearn.metrics.pairwise.cosine_similarity` (or `sentence_transformers.util.cos_sim`) for similarity computation.

The comparison pipeline is roughly:

1. Tokenize transcripts into sentences.
2. Embed each sentence using an SBERT model (`all-MiniLM-L6-v2` by default).
3. Compute similarities between sentences (matrix).
4. Detect missing sentences, paraphrase levels, key points using clustering, order analysis, and redundancy checks.

---

## Features and outputs

The main outputs returned by `compare(transcript, speech)` are:

- `overall_similarity`: float (cosine similarity between averaged embeddings)
- `structural_transcript` / `structural_speech`: sentence count, average sentence length, lexical density
- `missing_points`: list of transcript sentences likely not present in speech with similarity scores
- `key_points_transcript` / `key_points_speech`: cluster-representative sentences (top N key points)
- `alignment`: sentence-by-sentence mapping with similarity score and paraphrase classification
- `order_analysis`: percent of sentences present vs missing (a simple ordering metric)
- `redundant_speech_segments`: pairs of very-similar sentences inside the speech (possible repetition)
- `sentence_count_transcript`, `sentence_count_speech`

Each entry is intentionally readable for non-technical users (e.g., `Missing`, `Exact or Very Close`, `Mild Paraphrase`) while also providing raw similarity numbers for technical users.

---

## Quick start

1. Install Python (3.8+ recommended).
2. Create a folder and place two text files: `prepared_transcript.txt` and `delivered_speech.txt`.
3. Install dependencies (see Developer setup).
4. From a Python REPL or a small script, call the `SpeechComparer` and pass file contents as strings.

If you want, a helper command-line script can be added that reads these two files and prints the JSON report.

---

## Developer setup

### Recommended: use Poetry

```bash
# create a new project (if you haven't already)
poetry new speech-comparer
cd speech-comparer

# add packages
poetry add sentence-transformers scikit-learn numpy nltk

# if you want to run small CLI tooling or tests:
poetry add --dev pytest
```

### Or via pip + virtualenv

```bash
python -m venv .venv
source .venv/bin/activate   # macOS / Linux
.\.venv\Scripts\activate  # Windows PowerShell
pip install --upgrade pip
pip install sentence-transformers scikit-learn numpy nltk
```

### NLTK setup

Inside Python (or inside a bootstrap script) run:

```python
import nltk
nltk.download('punkt')
```

> Note: The original example contained a `nltk.download('punkt_tab')` line. That package name doesn't exist in the standard NLTK dataset; if you see an error for `punkt_tab` simply remove that line and ensure you have `'punkt'` downloaded as shown above.

### GPU (optional)

`sentence-transformers` can use GPU if `torch` with CUDA is available. Install `torch` with the correct CUDA version for better performance. Without GPU the model runs on CPU which is fine for small batches and testing.

---

## Configuration & thresholds

The class includes some global constants you can tune in code or expose as parameters:

- `MODEL_NAME` (default `'all-MiniLM-L6-v2'`): SBERT model used for embeddings. Smaller = faster, larger = higher-quality semantics.
- `MISSING_THRESHOLD` (default `0.65`): below this similarity a transcript sentence is considered "missing" from the speech.
- `PARAPHRASE_STRONG` (default `0.75`) and `PARAPHRASE_MILD` (default `0.85`): thresholds for paraphrase categorization. Adjust these for stricter or looser matching.
- `KEY_POINTS_COUNT` (default `3`): how many cluster-representative key points to return.

**Guideline**: If the speech language or domain is very different (e.g., legal text vs. conversational), you might reduce thresholds slightly or fine-tune them by hand on a small validation set.

---

## How it works — component details

### 1. Tokenization & Embedding
- Sentences are produced using `nltk.sent_tokenize`.
- Embeddings are produced by `SentenceTransformer(model_name).encode(..., convert_to_numpy=True)`.

### 2. Overall similarity
- Computed as cosine similarity between the mean embedding of the transcript and the mean embedding of the speech.

### 3. Missing points
- Build a similarity matrix between *each transcript sentence* and *each speech sentence*.
- For each transcript sentence the maximum similarity to any speech sentence is taken; if below `MISSING_THRESHOLD` it's flagged as missing.

### 4. Key points (clustering)
- Run KMeans on the sentence embeddings with `n_clusters = min(KEY_POINTS_COUNT, number_of_sentences)`.
- For each cluster, pick the sentence closest to the cluster centroid as the cluster representative (a key point).

### 5. Paraphrase detection & alignment
- For each transcript sentence, find the speech sentence with highest similarity and report the similarity score and paraphrase category.

### 6. Order & redundancy checks
- Order analysis: counts how many transcript sentences were not classified as `Missing` and reports percentages.
- Redundancy: computes an internal similarity matrix within the speech and reports pairs above a strict threshold (default `0.88`) — useful to detect repeated content.

---

## Usage examples

### Example — programmatic use

```python
from speech_comparer import SpeechComparer

# load file text
with open('prepared_transcript.txt', 'r', encoding='utf-8') as f:
    transcript = f.read()

with open('delivered_speech.txt', 'r', encoding='utf-8') as f:
    speech = f.read()

comparer = SpeechComparer()
report = comparer.compare(transcript, speech)

# pretty print or save JSON
import json
print(json.dumps(report, indent=2))
```

### Example — small helper CLI (suggested)

You can create a small `compare.py` script like:

```python
# compare.py (example)
import argparse
import json
from speech_comparer import SpeechComparer

parser = argparse.ArgumentParser()
parser.add_argument('--transcript', required=True)
parser.add_argument('--speech', required=True)
args = parser.parse_args()

with open(args.transcript, 'r', encoding='utf-8') as f:
    t = f.read()
with open(args.speech, 'r', encoding='utf-8') as f:
    s = f.read()

c = SpeechComparer()
r = c.compare(t, s)
print(json.dumps(r, indent=2))
```

Then run:

```bash
python compare.py --transcript prepared_transcript.txt --speech delivered_speech.txt
```

---

## Output schema & example result

**Short schema (JSON-like)**

```json
{
  "overall_similarity": 0.82,
  "structural_transcript": { "sentence_count": 5, "avg_sentence_length": 18.6, "lexical_density": 0.62 },
  "structural_speech": { ... },
  "missing_points": ["Sentence X (Sim=0.4512)", ...],
  "key_points_transcript": ["...", "..."],
  "alignment": [
     {"transcript_sentence":"...","closest_speech_sentence":"...","similarity":0.91,"paraphrase_type":"Exact or Very Close"},
     ...
  ],
  "order_analysis": {"in_order_percentage": 80.0, "out_of_order_percentage": 20.0},
  "redundant_speech_segments": [["sent A","sent B",0.92]],
  "sentence_count_transcript": 5,
  "sentence_count_speech": 6
}
```

> The numbers above are illustrative. Your exact values depend on the text and the model used.

---

## Performance & resource notes

- `all-MiniLM-L6-v2` is a compact and fast model suitable for CPU usage and for interactive use. If you need better semantic quality (rare paraphrase detection, fine-grained nuance) consider `all-mpnet-base-v2` or larger models from the `sentence-transformers` hub.

- Embedding many sentences (hundreds to thousands) is the slowest step. Batch the `.encode()` calls and prefer GPU when processing large corpora.

- KMeans clustering runtime increases with sentence count. For large inputs, consider approximate clustering (e.g., mini-batch KMeans) or extract key points by simple scoring heuristics.

---

## Testing & validation

- Add small unit tests using `pytest` that check:
  - Tokenization keeps expected sentence counts for sample inputs.
  - Embedding shapes are correct.
  - `find_missing_points` flags obviously absent sentences.
  - `paraphrase_level` returns expected category boundaries.

Example test skeleton:

```python
def test_paraphrase_levels():
    from speech_comparer import SpeechComparer
    c = SpeechComparer()
    assert c.paraphrase_level(0.90) == 'Exact or Very Close'
    assert c.paraphrase_level(0.80) == 'Mild Paraphrase'
    assert c.paraphrase_level(0.70) == 'Strong Paraphrase'
    assert c.paraphrase_level(0.50) == 'Missing'
```

---

## Troubleshooting & FAQ

**Q: I get an error downloading `punkt_tab`**
A: Remove the `nltk.download('punkt_tab')` call and only download `'punkt'`. `punkt_tab` is not a standard NLTK downloader resource.

**Q: The model download is slow or fails**
A: The first run downloads the model weights from the internet. Make sure you have network access. If your environment blocks downloads, pre-download the model on a machine with internet and set `TRANSFORMERS_CACHE` or the `sentence_transformers` cache folder appropriately.

**Q: Similarity scores look low for text that "sounds the same"**
A: Embeddings measure semantic similarity, but short sentences or named entities can be harder to score. Try using a larger model or provide more context per sentence (e.g., merge short adjacent sentences).

**Q: Out-of-memory or slow on CPU**
A: Reduce batch size when calling `.encode(...)` or switch to a smaller model. Install a GPU-friendly `torch` build when available.

---