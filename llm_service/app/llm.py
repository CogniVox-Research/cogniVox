from transformers import AutoModelForCausalLM, AutoTokenizer
from config import config

model_name = "Qwen/Qwen3-0.6B"

#   # prepare the model input
#     prompt = "Give me a short introduction to large language model."
#     messages = [
#         {"role": "system", "content": "All "},
#         {"role": "user", "content": prompt},
#     ]


def generate_content(messages):
    # load the tokenizer and the model
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name, dtype="auto", device_map="auto"
    )

    if isinstance(messages, str):
        text = messages
    else:
        text = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
            enable_thinking=config.enable_thinking,
        )

    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)

    # conduct text completion
    generated_ids = model.generate(**model_inputs, max_new_tokens=32768)
    output_ids = generated_ids[0][len(model_inputs.input_ids[0]) :].tolist()

    # parsing thinking content
    try:
        # rindex finding 151668 (</think>)
        index = len(output_ids) - output_ids[::-1].index(151668)
    except ValueError:
        index = 0

    thinking_content = tokenizer.decode(
        output_ids[:index], skip_special_tokens=True
    ).strip("\n")
    print(thinking_content)

    content = tokenizer.decode(output_ids[index:], skip_special_tokens=True).strip("\n")

    return content
