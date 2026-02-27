import warnings

import spacy
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer

__all__ = ["checker"]

warnings.filterwarnings("ignore")


class SpeechGrammarChecker:
    def __init__(self):
        print("Loading models...")

        self.device = "cpu"
        print(f"Using device: {self.device}")

        model_name = "vennify/t5-base-grammar-correction"

        self.tokenizer = T5Tokenizer.from_pretrained(model_name)
        self.model = T5ForConditionalGeneration.from_pretrained(model_name).to(
            self.device
        )

        self.nlp = spacy.load("en_core_web_md")

    def correct_sentence(self, sentence):
        input_text = "grammar: " + sentence
        input_ids = self.tokenizer.encode(input_text, return_tensors="pt").to(
            self.device
        )

        outputs = self.model.generate(
            input_ids, max_length=128, num_beams=4, early_stopping=True
        )
        corrected = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        return corrected

    def check_errors(self, paragraph):
        doc = self.nlp(paragraph)
        detected_errors = []

        for sent in doc.sents:
            original = sent.text.strip()
            if not original:
                continue

            corrected = self.correct_sentence(original)

            if original != corrected:
                detected_errors.append((original, corrected))

        return [{"original": i[0], "corrected": i[1]} for i in detected_errors]


checker = SpeechGrammarChecker()


def test():
    # ============================================================
    #                EXAMPLE APPLICATION USAGE
    # ============================================================
    speech_paragraph = (
        "Yesterday I go to the market and I see a friend. "
        "I says him that we can meets tomorrow at the office. "
        "He tell me that he want to discuss about the project. "
        "The weather were really bad so I didnt stayed long."
    )

    # Get the list of errors
    errors = checker.check_errors(speech_paragraph)

    # Print the Report
    print(f"{'=' * 20} GRAMMAR ERROR REPORT {'=' * 20}\n")

    if not errors:
        print("No errors found! Good job.")
    else:
        for idx, err in enumerate(errors, 1):
            print(f"❌ Error Found in Segment {idx}:")
            print(f"   Original:  {err['original']}")
            print(f"   Corrected: {err['corrected']}")
            print("-" * 50)


if __name__ == "__main__":
    test()
