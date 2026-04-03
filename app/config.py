import os
import tempfile

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500 MB total upload limit
    MAX_FILE_SIZE = 100 * 1024 * 1024        # 100 MB per file
    UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), 'pdfmerger')
    ALLOWED_EXTENSIONS = {'pdf'}
    FILE_EXPIRY_SECONDS = 1800  # 30 minutes
    CLEANUP_INTERVAL_SECONDS = 900  # 15 minutes
    THUMBNAIL_DPI = 72
    THUMBNAIL_FORMAT = 'JPEG'
    WTF_CSRF_ENABLED = True


class DevelopmentConfig(Config):
    DEBUG = True
    WTF_CSRF_ENABLED = False  # easier during dev


class ProductionConfig(Config):
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
