import os
import time
import shutil
import threading
import logging

logger = logging.getLogger(__name__)


def cleanup_expired_files(upload_folder, expiry_seconds):
    """Remove subdirectories in upload_folder older than expiry_seconds."""
    now = time.time()
    if not os.path.isdir(upload_folder):
        return

    removed = 0
    for entry in os.scandir(upload_folder):
        if entry.is_dir():
            try:
                age = now - entry.stat().st_mtime
                if age > expiry_seconds:
                    shutil.rmtree(entry.path, ignore_errors=True)
                    removed += 1
            except Exception as e:
                logger.warning(f'Cleanup error for {entry.path}: {e}')

    if removed:
        logger.info(f'Cleanup: removed {removed} expired session(s)')


def start_cleanup_scheduler(app):
    """Start a background daemon thread that periodically cleans up temp files."""
    interval = app.config.get('CLEANUP_INTERVAL_SECONDS', 900)
    upload_folder = app.config['UPLOAD_FOLDER']
    expiry_seconds = app.config.get('FILE_EXPIRY_SECONDS', 1800)

    def _run():
        while True:
            time.sleep(interval)
            try:
                cleanup_expired_files(upload_folder, expiry_seconds)
            except Exception as e:
                logger.error(f'Cleanup scheduler error: {e}')

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
