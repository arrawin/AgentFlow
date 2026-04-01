from fastapi import APIRouter, UploadFile, File, Form
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
async def upload_file(file: UploadFile = File(...), subfolder: str = Form(default="")):
    safe_filename = sanitize_filename(file.filename)
    
    if subfolder:
        # Only allow simple subfolder names, no path traversal
        subfolder = re.sub(r'[^\w\-]', '', subfolder)
        target_dir = os.path.join(UPLOAD_DIR, subfolder)
        os.makedirs(target_dir, exist_ok=True)
    else:
        target_dir = UPLOAD_DIR

    file_path = os.path.join(target_dir, safe_filename)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    return {"filename": safe_filename, "message": "Upload successful", "path": file_path}


@router.get("")
def list_files():
    if not os.path.exists(UPLOAD_DIR):
        return {"files": [], "folders": {}}
    
    # Root level files only (no dirs, no temp files)
    root_files = [
        f for f in os.listdir(UPLOAD_DIR)
        if os.path.isfile(os.path.join(UPLOAD_DIR, f))
        and not f.startswith('_run_')
        and not f.startswith('_agent_')
    ]
    
    # Subfolders with their files
    folders = {}
    for entry in os.listdir(UPLOAD_DIR):
        entry_path = os.path.join(UPLOAD_DIR, entry)
        if os.path.isdir(entry_path):
            folder_files = [
                f for f in os.listdir(entry_path)
                if os.path.isfile(os.path.join(entry_path, f))
                and not f.startswith('_run_')
            ]
            folders[entry] = sorted(folder_files)
    
    return {"files": sorted(root_files), "folders": folders}


@router.delete("/{filepath:path}")
def delete_file(filepath: str):
    from tools.utils import safe_path
    try:
        path = safe_path(filepath)
        os.remove(path)
        return {"message": f"File '{filepath}' deleted"}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/download/{filepath:path}")
def download_file(filepath: str):
    from tools.utils import safe_path
    from fastapi.responses import FileResponse
    from fastapi import HTTPException
    try:
        path = safe_path(filepath)
        filename = os.path.basename(filepath)
        return FileResponse(path, filename=filename, media_type="application/octet-stream")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))