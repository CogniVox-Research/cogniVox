from pathlib import Path

import spacy


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
    download_dir = Path(__file__).parent.parent / "models" / "spacy"
    download_dir.mkdir(exist_ok=True, parents=True)

    model_path = download_dir / model_name
    try:
        return spacy.load(model_path)
    except OSError:
        return _download_model(model_name, model_path)
