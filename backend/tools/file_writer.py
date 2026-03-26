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

    filename = input_data.get("filename") or input_data.get("file") or input_data.get("name")
    content = input_data.get("content") or input_data.get("text") or input_data.get("data")

    if not filename:
        return "Error: 'filename' is required for file_writer"
    if content is None:
        return "Error: 'content' is required for file_writer"

    # Sanitize - only allow filename, no path traversal
    filename = os.path.basename(filename)
    if not filename:
        return "Error: invalid filename"

    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        path = os.path.join(UPLOAD_DIR, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(str(content))
        return f"File '{filename}' written successfully ({len(str(content))} chars). It is now available in the uploads directory."
    except Exception as e:
        return f"Error writing file: {str(e)}"
