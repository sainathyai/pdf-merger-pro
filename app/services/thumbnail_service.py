import os
import base64
import io

# pdf2image requires poppler; if not available we fall back to a placeholder
try:
    from pdf2image import convert_from_path
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False

from PIL import Image, ImageDraw, ImageFont


def generate_thumbnails(pdf_path, dpi=72):
    """
    Generate thumbnail images for every page in the PDF.
    Returns a list of base64-encoded JPEG strings (one per page).
    Falls back to placeholder images if pdf2image/poppler is unavailable.
    """
    if PDF2IMAGE_AVAILABLE:
        try:
            images = convert_from_path(pdf_path, dpi=dpi, fmt='jpeg')
            thumbnails = []
            for img in images:
                img.thumbnail((200, 280), Image.LANCZOS)
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=75)
                thumbnails.append(base64.b64encode(buf.getvalue()).decode('utf-8'))
            return thumbnails
        except Exception:
            pass

    # Fallback: generate placeholder thumbnails using Pillow
    from pypdf import PdfReader
    reader = PdfReader(pdf_path)
    return [_placeholder_thumbnail(i + 1) for i in range(len(reader.pages))]


def generate_single_thumbnail(pdf_path, page_number, dpi=72):
    """
    Generate a thumbnail for a single page (1-indexed).
    Returns base64-encoded JPEG string.
    """
    if PDF2IMAGE_AVAILABLE:
        try:
            images = convert_from_path(
                pdf_path, dpi=dpi, fmt='jpeg',
                first_page=page_number, last_page=page_number
            )
            if images:
                img = images[0]
                img.thumbnail((200, 280), Image.LANCZOS)
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=75)
                return base64.b64encode(buf.getvalue()).decode('utf-8')
        except Exception:
            pass

    return _placeholder_thumbnail(page_number)


def _placeholder_thumbnail(page_number):
    """Create a simple gray placeholder thumbnail with the page number."""
    img = Image.new('RGB', (160, 210), color='#F1F5F9')
    draw = ImageDraw.Draw(img)

    # Draw a border
    draw.rectangle([4, 4, 155, 205], outline='#CBD5E1', width=1)

    # Draw document lines
    for i in range(5):
        y = 60 + i * 20
        draw.rectangle([24, y, 136, y + 8], fill='#E2E8F0')

    # Draw page number
    text = str(page_number)
    draw.text((80, 160), text, fill='#94A3B8', anchor='mm')

    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    return base64.b64encode(buf.getvalue()).decode('utf-8')
