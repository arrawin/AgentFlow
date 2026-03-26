from tools.utils import safe_path

def file_reader(input_data) -> str:
    # Accept both string and dict input
    if isinstance(input_data, str):
        filename = input_data
    elif isinstance(input_data, dict):
        filename = input_data.get("filename") or input_data.get("file_path") or input_data.get("file")
    else:
        return "Error: invalid input for file_reader"

    if not filename:
        return "Error: filename is required"

    try:
        path = safe_path(filename)
        with open(path, "r", encoding="utf-8") as f:
            return f.read()[:5000]
    except Exception as e:
        return f"Error: {str(e)}"