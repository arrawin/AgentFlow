from fastapi import APIRouter, UploadFile, File
import os
import re
from tools.utils import UPLOAD_DIR

router = APIRouter()


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent security issues and invalid characters."""
    # Remove path separators and invalid characters
    filename = os.path.basename(filename)
    # Keep only alphanumeric, dots, dashes, underscores
    filename = re.sub(r'[^\w\-\.]', '_', filename)
    # Remove leading/trailing dots and dashes
    filename = filename.strip('.-')
    # Ensure filename is not empty
    if not filename or filename == '-' or filename == '.':
        filename = 'uploaded_file'
    return filename


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    safe_filename = sanitize_filename(file.filename)
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {"filename": safe_filename, "message": "Upload successful"}


@router.get("")
def list_files():
    files = os.listdir(UPLOAD_DIR) if os.path.exists(UPLOAD_DIR) else []
    return {"files": sorted(files)}