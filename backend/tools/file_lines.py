from tools.utils import safe_path

def file_lines(input_data):
    if isinstance(input_data, str):
        filename = input_data
        start, end = 1, 50
    elif isinstance(input_data, dict):
        filename = input_data.get("filename") or input_data.get("file_path") or input_data.get("file") or input_data.get("path")
        start = input_data.get("start", 1)
        end = input_data.get("end", 50)
    else:
        return "Error: invalid input for file_lines"

    if not filename:
        return "Error: filename is required"

    try:
        path = safe_path(filename)
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        return "".join(lines[start - 1:end])
    except Exception as e:
        return str(e)