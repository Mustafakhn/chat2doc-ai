from PyPDF2 import PdfReader
import docx

def extract_text_from_pdf(path: str) -> str:
    text = ""
    try:
        reader = PdfReader(path)
        for page in reader.pages:
            text += page.extract_text() or ""
    except Exception:
        pass
    return text

def extract_text_from_docx(path: str) -> str:
    try:
        doc = docx.Document(path)
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception:
        return ""

def extract_text_from_file(path: str) -> str:
    if path.lower().endswith('.pdf'):
        return extract_text_from_pdf(path)
    if path.lower().endswith('.docx'):
        return extract_text_from_docx(path)
    if path.lower().endswith('.txt'):
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    return ""
