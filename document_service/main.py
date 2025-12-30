from fastapi import FastAPI, File, UploadFile, HTTPException
from pypdf import PdfReader
import io

app = FastAPI()

ALLOWED_TYPES = ["text/plain", "application/pdf"]


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only TXT and PDF files are supported"
        )

    content = await file.read()

    if file.content_type == "text/plain":
        text = content.decode("utf-8", errors="ignore")

    else:  # PDF
        text = extract_text_from_pdf(content)

    return {
        "filename": file.filename,
        "file_type": file.content_type,
        "text": text
    }


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages_text = []

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            pages_text.append(page_text)

    return "\n".join(pages_text)
