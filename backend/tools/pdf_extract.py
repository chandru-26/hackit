#!/usr/bin/env python3
"""
Simple PDF text extractor for use as a fallback when node's pdf-parse fails.
Tries pdfplumber first, then falls back to PyPDF2 (PdfReader).
Usage: python pdf_extract.py /path/to/file.pdf
Prints extracted text to stdout.
"""
import sys
import os

def extract_with_pdfplumber(path):
    import pdfplumber
    texts = []
    with pdfplumber.open(path) as pdf:
        for p in pdf.pages:
            t = p.extract_text()
            if t:
                texts.append(t)
    return "\n".join(texts)

def extract_with_pypdf(path):
    from PyPDF2 import PdfReader
    texts = []
    reader = PdfReader(path)
    for p in reader.pages:
        try:
            t = p.extract_text() or ''
        except Exception:
            t = ''
        texts.append(t)
    return "\n".join(texts)

def main():
    if len(sys.argv) < 2:
        return
    path = sys.argv[1]
    if not os.path.exists(path):
        return

    out = ''
    try:
        out = extract_with_pdfplumber(path)
    except Exception:
        try:
            out = extract_with_pypdf(path)
        except Exception:
            out = ''

    # Print whatever we extracted (may be empty)
    sys.stdout.write(out)

if __name__ == '__main__':
    main()
