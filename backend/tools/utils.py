import os

UPLOAD_DIR = os.path.abspath(os.getenv("UPLOAD_DIR", "/app/uploads"))

# Ensure uploads directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

def safe_path(filename: str) -> str:
    # Strip any path traversal attempts
    filename = os.path.basename(filename)
    path = os.path.abspath(os.path.join(UPLOAD_DIR, filename))

    # Strictly enforce uploads directory
    if not path.startswith(UPLOAD_DIR + os.sep) and path != UPLOAD_DIR:
        raise Exception(f"Access denied: '{filename}' is outside the uploads directory")

    if not os.path.exists(path):
        raise Exception(f"File '{filename}' not found in uploads directory")

    return path