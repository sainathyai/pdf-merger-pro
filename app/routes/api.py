import os
import uuid
import shutil
from flask import Blueprint, request, jsonify, send_file, current_app

from ..services.pdf_service import (
    merge_pdfs, split_pdf, split_all_pages, reorder_pdf,
    get_pdf_info, parse_page_range,
)
from ..services.thumbnail_service import generate_thumbnails

api_bp = Blueprint('api', __name__)

ALLOWED_EXTENSIONS = {'pdf'}


def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def _upload_folder():
    return current_app.config['UPLOAD_FOLDER']


def _max_file_size():
    return current_app.config.get('MAX_FILE_SIZE', 100 * 1024 * 1024)


# ---------------------------------------------------------------------------
# Upload a single PDF → returns file_id, page_count, thumbnails
# ---------------------------------------------------------------------------
@api_bp.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not _allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are supported'}), 400

    # Read into memory to check size before saving
    file_data = file.read()
    if len(file_data) > _max_file_size():
        return jsonify({'error': f'File exceeds 100 MB limit'}), 413

    file_id = str(uuid.uuid4())
    file_dir = os.path.join(_upload_folder(), file_id)
    os.makedirs(file_dir, exist_ok=True)

    # Save with a safe name
    safe_name = _safe_filename(file.filename)
    file_path = os.path.join(file_dir, safe_name)
    with open(file_path, 'wb') as f:
        f.write(file_data)

    try:
        info = get_pdf_info(file_path)
    except Exception:
        shutil.rmtree(file_dir, ignore_errors=True)
        return jsonify({'error': 'Could not read PDF. The file may be corrupted or password-protected.'}), 422

    try:
        thumbnails = generate_thumbnails(file_path, dpi=current_app.config.get('THUMBNAIL_DPI', 72))
    except Exception:
        thumbnails = []

    return jsonify({
        'file_id': file_id,
        'filename': safe_name,
        'original_name': file.filename,
        'page_count': info['page_count'],
        'file_size': info['file_size'],
        'is_encrypted': info['is_encrypted'],
        'thumbnails': thumbnails,
    })


# ---------------------------------------------------------------------------
# Merge multiple already-uploaded files
# ---------------------------------------------------------------------------
@api_bp.route('/merge', methods=['POST'])
def merge():
    data = request.get_json(silent=True) or {}
    file_ids = data.get('file_ids', [])
    output_name = data.get('output_name', 'merged-document')

    if len(file_ids) < 2:
        return jsonify({'error': 'At least 2 files are required to merge'}), 400

    upload_folder = _upload_folder()
    file_paths = []
    for fid in file_ids:
        fdir = os.path.join(upload_folder, fid)
        if not os.path.isdir(fdir):
            return jsonify({'error': f'File session {fid} not found or expired'}), 404
        # Find the PDF inside the session dir
        pdfs = [f for f in os.listdir(fdir) if f.endswith('.pdf')]
        if not pdfs:
            return jsonify({'error': f'No PDF found in session {fid}'}), 404
        file_paths.append(os.path.join(fdir, pdfs[0]))

    try:
        out_id, out_filename, page_count = merge_pdfs(file_paths, output_name, upload_folder)
    except Exception as e:
        return jsonify({'error': f'Merge failed: {str(e)}'}), 500

    return jsonify({
        'result_id': out_id,
        'filename': out_filename,
        'page_count': page_count,
    })


# ---------------------------------------------------------------------------
# Split a PDF by page selection
# ---------------------------------------------------------------------------
@api_bp.route('/split', methods=['POST'])
def split():
    data = request.get_json(silent=True) or {}
    file_id = data.get('file_id')
    mode = data.get('mode', 'pages')        # 'pages' | 'all'
    pages_input = data.get('pages', '')     # "1-3, 5" or list of ints
    upload_folder = _upload_folder()

    if not file_id:
        return jsonify({'error': 'file_id is required'}), 400

    fdir = os.path.join(upload_folder, file_id)
    if not os.path.isdir(fdir):
        return jsonify({'error': 'File session not found or expired'}), 404

    pdfs = [f for f in os.listdir(fdir) if f.endswith('.pdf')]
    if not pdfs:
        return jsonify({'error': 'No PDF found in session'}), 404
    file_path = os.path.join(fdir, pdfs[0])

    try:
        from pypdf import PdfReader
        total_pages = len(PdfReader(file_path).pages)
    except Exception as e:
        return jsonify({'error': f'Could not read PDF: {str(e)}'}), 422

    if mode == 'all':
        try:
            out_id, out_filename = split_all_pages(file_path, upload_folder)
        except Exception as e:
            return jsonify({'error': f'Split failed: {str(e)}'}), 500
        return jsonify({'result_id': out_id, 'filename': out_filename})

    # Parse pages
    if isinstance(pages_input, list):
        page_numbers = [p - 1 for p in pages_input if 1 <= p <= total_pages]
    else:
        page_numbers = parse_page_range(str(pages_input), total_pages)

    if not page_numbers:
        return jsonify({'error': 'No valid pages selected'}), 400

    try:
        out_id, out_filename = split_pdf(file_path, page_numbers, upload_folder)
    except Exception as e:
        return jsonify({'error': f'Split failed: {str(e)}'}), 500

    return jsonify({'result_id': out_id, 'filename': out_filename, 'page_count': len(page_numbers)})


# ---------------------------------------------------------------------------
# Reorder / rotate pages
# ---------------------------------------------------------------------------
@api_bp.route('/reorder', methods=['POST'])
def reorder():
    data = request.get_json(silent=True) or {}
    file_id = data.get('file_id')
    page_order = data.get('page_order', [])   # list of 0-indexed page numbers
    rotations = data.get('rotations', {})      # {"0": 90, "2": 180, ...}
    upload_folder = _upload_folder()

    if not file_id:
        return jsonify({'error': 'file_id is required'}), 400

    fdir = os.path.join(upload_folder, file_id)
    if not os.path.isdir(fdir):
        return jsonify({'error': 'File session not found or expired'}), 404

    pdfs = [f for f in os.listdir(fdir) if f.endswith('.pdf') and f != 'reordered.pdf']
    if not pdfs:
        return jsonify({'error': 'No PDF found in session'}), 404
    file_path = os.path.join(fdir, pdfs[0])

    if not page_order:
        from pypdf import PdfReader
        total = len(PdfReader(file_path).pages)
        page_order = list(range(total))

    try:
        out_id, out_filename = reorder_pdf(file_path, page_order, rotations, upload_folder)
    except Exception as e:
        return jsonify({'error': f'Reorder failed: {str(e)}'}), 500

    return jsonify({'result_id': out_id, 'filename': out_filename, 'page_count': len(page_order)})


# ---------------------------------------------------------------------------
# Download a result file
# ---------------------------------------------------------------------------
@api_bp.route('/download/<result_id>', methods=['GET'])
def download(result_id):
    upload_folder = _upload_folder()
    result_dir = os.path.join(upload_folder, result_id)

    if not os.path.isdir(result_dir):
        return jsonify({'error': 'File not found or expired'}), 404

    # Find the first file (pdf or zip)
    files = [f for f in os.listdir(result_dir) if f.endswith(('.pdf', '.zip'))]
    if not files:
        return jsonify({'error': 'No downloadable file found'}), 404

    filename = files[0]
    file_path = os.path.join(result_dir, filename)

    mime = 'application/zip' if filename.endswith('.zip') else 'application/pdf'
    return send_file(file_path, as_attachment=True, download_name=filename, mimetype=mime)


# ---------------------------------------------------------------------------
# Delete an uploaded file session
# ---------------------------------------------------------------------------
@api_bp.route('/files/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    upload_folder = _upload_folder()
    fdir = os.path.join(upload_folder, file_id)

    # Security: ensure the path is inside upload_folder
    fdir = os.path.realpath(fdir)
    if not fdir.startswith(os.path.realpath(upload_folder)):
        return jsonify({'error': 'Invalid file ID'}), 400

    if os.path.isdir(fdir):
        shutil.rmtree(fdir, ignore_errors=True)

    return jsonify({'success': True})


def _safe_filename(filename):
    import re
    filename = os.path.basename(filename)
    filename = re.sub(r'[^\w\-_. ]', '_', filename).strip()
    return filename or 'upload.pdf'
