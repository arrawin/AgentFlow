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


@router.delete("/{filename}")
def delete_file(filename: str):
    from tools.utils import safe_path
    try:
        path = safe_path(filename)
        os.remove(path)
        return {"message": f"File '{filename}' deleted"}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/download/{filename}")
def download_file(filename: str):
    from tools.utils import safe_path
    from fastapi.responses import FileResponse
    from fastapi import HTTPException
    try:
        path = safe_path(filename)
        return FileResponse(path, filename=filename, media_type="application/octet-stream")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))