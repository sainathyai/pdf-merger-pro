import os
import uuid
from pypdf import PdfWriter, PdfReader


def _get_upload_folder(app):
    return app.config['UPLOAD_FOLDER']


def merge_pdfs(file_paths, output_name, upload_folder):
    """Merge a list of PDF file paths into one. Returns (output_path, page_count)."""
    writer = PdfWriter()
    for path in file_paths:
        reader = PdfReader(path)
        for page in reader.pages:
            writer.add_page(page)

    out_id = str(uuid.uuid4())
    out_dir = os.path.join(upload_folder, out_id)
    os.makedirs(out_dir, exist_ok=True)
    safe_name = _safe_filename(output_name) + '.pdf'
    out_path = os.path.join(out_dir, safe_name)

    with open(out_path, 'wb') as f:
        writer.write(f)

    return out_id, safe_name, len(writer.pages)


def split_pdf(file_path, page_numbers, upload_folder):
    """Extract specific pages (0-indexed list) into a new PDF. Returns (out_id, filename)."""
    reader = PdfReader(file_path)
    writer = PdfWriter()

    for idx in page_numbers:
        if 0 <= idx < len(reader.pages):
            writer.add_page(reader.pages[idx])

    out_id = str(uuid.uuid4())
    out_dir = os.path.join(upload_folder, out_id)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'extracted.pdf')

    with open(out_path, 'wb') as f:
        writer.write(f)

    return out_id, 'extracted.pdf'


def split_all_pages(file_path, upload_folder):
    """Split PDF into one file per page. Returns (out_id, zip_filename)."""
    import zipfile

    reader = PdfReader(file_path)
    out_id = str(uuid.uuid4())
    out_dir = os.path.join(upload_folder, out_id)
    os.makedirs(out_dir, exist_ok=True)

    page_files = []
    for i, page in enumerate(reader.pages):
        writer = PdfWriter()
        writer.add_page(page)
        page_filename = f'page_{i + 1:03d}.pdf'
        page_path = os.path.join(out_dir, page_filename)
        with open(page_path, 'wb') as f:
            writer.write(f)
        page_files.append(page_filename)

    zip_filename = 'split_pages.zip'
    zip_path = os.path.join(out_dir, zip_filename)
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for page_filename in page_files:
            zf.write(os.path.join(out_dir, page_filename), page_filename)

    return out_id, zip_filename


def reorder_pdf(file_path, page_order, rotations, upload_folder):
    """
    Reorder and/or rotate pages.
    page_order: list of 0-indexed page numbers in desired order
    rotations: dict mapping page index (in original) to rotation degrees
    Returns (out_id, filename).
    """
    reader = PdfReader(file_path)
    writer = PdfWriter()

    for orig_idx in page_order:
        if 0 <= orig_idx < len(reader.pages):
            page = reader.pages[orig_idx]
            rotation = rotations.get(str(orig_idx), 0)
            if rotation:
                page = page.rotate(rotation)
            writer.add_page(page)

    out_id = str(uuid.uuid4())
    out_dir = os.path.join(upload_folder, out_id)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'reordered.pdf')

    with open(out_path, 'wb') as f:
        writer.write(f)

    return out_id, 'reordered.pdf'


def get_pdf_info(file_path):
    """Return basic info about a PDF: page_count, file_size."""
    reader = PdfReader(file_path)
    return {
        'page_count': len(reader.pages),
        'file_size': os.path.getsize(file_path),
        'is_encrypted': reader.is_encrypted,
    }


def parse_page_range(range_str, total_pages):
    """
    Parse a page range string like "1-3, 5, 8-12" into a sorted list of 0-indexed page numbers.
    Returns list of valid 0-indexed integers.
    """
    pages = set()
    for part in range_str.split(','):
        part = part.strip()
        if '-' in part:
            try:
                start, end = part.split('-', 1)
                start, end = int(start.strip()), int(end.strip())
                for p in range(start, end + 1):
                    if 1 <= p <= total_pages:
                        pages.add(p - 1)
            except ValueError:
                pass
        else:
            try:
                p = int(part)
                if 1 <= p <= total_pages:
                    pages.add(p - 1)
            except ValueError:
                pass
    return sorted(pages)


def _safe_filename(name):
    import re
    name = os.path.splitext(name)[0]
    name = re.sub(r'[^\w\-_. ]', '', name).strip()
    return name or 'merged-document'
