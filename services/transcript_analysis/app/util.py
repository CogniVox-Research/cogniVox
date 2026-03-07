from pathlib import Path

import numpy as np
import spacy
import torch

from app.config import config

model_dir = Path(__file__).parent.parent / "models"
model_dir.mkdir(exist_ok=True, parents=True)


def convert_numpy_to_python(obj):
    """
    Recursively convert numpy types to Python native types in nested structures.

    Args:
        obj: Any object (dict, list, numpy type, or other)

    Returns:
        Object with all numpy types converted to Python native types
    """
    if isinstance(obj, dict):
        return {key: convert_numpy_to_python(value) for key, value in obj.items()}

    elif isinstance(obj, list):
        return [convert_numpy_to_python(item) for item in obj]

    elif isinstance(obj, tuple):
        return tuple(convert_numpy_to_python(item) for item in obj)

    elif isinstance(obj, np.ndarray):
        return convert_numpy_to_python(obj.tolist())

    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)

    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
        return float(obj)

    elif isinstance(obj, np.bool_):
        return bool(obj)

    elif isinstance(obj, np.complexfloating):
        return complex(obj)

    elif isinstance(obj, np.ndarray):
        return obj.tolist()

    else:
        return obj


def _download_model(model_name: str, model_path: Path):
    from spacy import cli as spacy_cli
    from spacy.cli.download import get_compatibility, get_model_filename, get_version

    compatibility = get_compatibility()
    version = get_version(model_name, compatibility)
    filename = get_model_filename(model_name, version, False)

    spacy_cli.download_module.download_model(filename)
    nlp = spacy.load(model_name)
    nlp.to_disk(model_path)
    return nlp


def spacy_load_or_download(model_name: str):
    download_dir = model_dir / "spacy"
    download_dir.mkdir(exist_ok=True, parents=True)

    model_path = download_dir / model_name
    try:
        return spacy.load(model_path)
    except OSError:
        return _download_model(model_name, model_path)


def is_out_of_memory(e: Exception) -> bool:
    if isinstance(e, torch.AcceleratorError) and "out of memory" in str(e):
        return True
    elif isinstance(e, torch.OutOfMemoryError):
        return True

    return False


def download_nltk():
    from nltk.downloader import nltk

    nltk.data.path.append(str(model_dir))
    nltk.download("punkt", model_dir)
    nltk.download("punkt_tab", model_dir)
