import PyPDF2
from typing import BinaryIO


def extract_text_from_pdf(pdf_file: BinaryIO) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_file)

        if len(pdf_reader.pages) == 0:
            raise Exception("PDF file is empty (no pages)")

        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"

        text = text.strip()

        if not text:
            raise Exception("No text could be extracted from PDF. It might be a scanned image.")

        return text

    except PyPDF2.errors.PdfReadError as e:
        raise Exception(f"Failed to read PDF: {str(e)}")
    except Exception as e:
        raise Exception(f"PDF extraction error: {str(e)}")
