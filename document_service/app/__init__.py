from pathlib import Path
import re
import shutil
import aiofiles
from fastapi import FastAPI, File, UploadFile, HTTPException
import pydantic
from pypdf import PdfReader
import io

from .config import config

__all__ = ["app", "config"]


app = FastAPI()
print(config)

ALLOWED_TYPES = ["text/plain", "application/pdf"]


class FileData(pydantic.BaseModel):
    filename: str
    file_type: str
    text: str


@app.post("/upload/{session_id}")
async def upload_file(session_id: str, file: UploadFile = File()):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400, detail="Only TXT and PDF files are supported"
        )

    content = await file.read()

    if file.content_type == "text/plain":
        text = content.decode("utf-8", errors="ignore")
    else:  # PDF
        text = extract_text_from_pdf(content)

    file_data = FileData(
        filename=file.filename or "unknown", file_type=file.content_type, text=text
    )

    clean_session_id = re.sub(r"[/\\?%*:|\"<>\x7F\x00-\x1F]", "-", session_id)
    upload_dir = Path(config.upload_dir).absolute() / clean_session_id
    if upload_dir.exists():
        print("upload dir already exists")
        shutil.rmtree(upload_dir)

    upload_dir.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(upload_dir / "document", "wb") as f:
        await f.write(content)

    async with aiofiles.open(upload_dir / "transcript.json", "w") as f:
        await f.write(file_data.model_dump_json())

    return file_data


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages_text = []

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            pages_text.append(page_text)

    return "\n".join(pages_text)
