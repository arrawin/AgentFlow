from tools.utils import safe_path
import os


def pdf_reader(input_data) -> str:
    """
    Extract text from a PDF file in the uploads directory.

    Args:
        input_data: dict with 'filename' OR string filename

    Returns:
        Extracted text content
    """
    if isinstance(input_data, str):
        filename = input_data
    elif isinstance(input_data, dict):
        filename = input_data.get("filename") or input_data.get("file_path") or input_data.get("file")
    else:
        return "Error: invalid input for pdf_reader"

    if not filename:
        return "Error: 'filename' is required for pdf_reader"

    try:
        path = safe_path(filename)

        if not path.lower().endswith(".pdf"):
            return f"Error: '{filename}' is not a PDF file"

        # Try pypdf first (lightweight)
        try:
            import pypdf
            reader = pypdf.PdfReader(path)
            text = ""
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                text += f"\n--- Page {i + 1} ---\n{page_text}"
            if text.strip():
                content = text[:20000] + ("\n...[truncated]" if len(text) > 20000 else "")
                return f"<external_data source='pdf:{filename}'>\n{content}\n</external_data>"
        except ImportError:
            pass

        # Fallback: pdfplumber
        try:
            import pdfplumber
            text = ""
            with pdfplumber.open(path) as pdf:
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text() or ""
                    text += f"\n--- Page {i + 1} ---\n{page_text}"
            if text.strip():
                content = text[:20000] + ("\n...[truncated]" if len(text) > 20000 else "")
                return f"<external_data source='pdf:{filename}'>\n{content}\n</external_data>"
        except ImportError:
            pass

        return "Error: No PDF library available. Install pypdf or pdfplumber."

    except Exception as e:
        return f"Error reading PDF: {str(e)}"
