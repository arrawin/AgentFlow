from tools.utils import safe_path

def file_search(input_data):
    if isinstance(input_data, str):
        return "Error: file_search requires both 'filename' and 'query'"

    filename = (input_data.get("filename") or input_data.get("file_path") or
                input_data.get("file") or input_data.get("path"))
    query = (input_data.get("query") or input_data.get("search_query") or
             input_data.get("keyword") or input_data.get("search_term") or
             input_data.get("pattern"))

    if not filename:
        return "Error: 'filename' is required for file_search"
    if not query:
        return "Error: 'query' is required for file_search"

    try:
        path = safe_path(filename)
        results = []
        with open(path, "r", encoding="utf-8") as f:
            for i, line in enumerate(f, 1):
                if query.lower() in line.lower():
                    results.append(f"Line {i}: {line.strip()}")
        return "\n".join(results[:20]) if results else "No matches found"
    except Exception as e:
        return str(e)
