from tools.utils import UPLOAD_DIR
import os


def file_writer(input_data) -> str:
    """
    Write content to a file in the uploads directory.

    Args:
        input_data: dict with 'filename' and 'content'
                    OR string (treated as content, auto-named)

    Returns:
        Success or error message
    """
    if isinstance(input_data, str):
        return "Error: file_writer requires {'filename': '...', 'content': '...'}"

    filename = (
        input_data.get("filename") or
        input_data.get("file_name") or
        input_data.get("file") or
        input_data.get("name")
    )
    content = input_data.get("content") or input_data.get("text") or input_data.get("data")

    # Auto-generate filename if not provided
    if not filename:
        import time
        filename = f"output_{int(time.time())}.md"
    if content is None:
        return "Error: 'content' is required for file_writer"

    # Sanitize - only allow filename, no path traversal
    filename = os.path.basename(filename)
    if not filename:
        return "Error: invalid filename"

    # If file already exists, append timestamp to avoid overwriting
    if os.path.exists(os.path.join(UPLOAD_DIR, filename)):
        import time
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{int(time.time())}{ext}"

    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        path = os.path.join(UPLOAD_DIR, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(str(content))
        return f"File '{filename}' written successfully ({len(str(content))} chars). It is now available in the uploads directory."
    except Exception as e:
        return f"Error writing file: {str(e)}"
