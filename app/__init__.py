import os
from flask import Flask
from .config import config


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'default')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register blueprints
    from .routes.main import main_bp
    from .routes.merge import merge_bp
    from .routes.split import split_bp
    from .routes.reorder import reorder_bp
    from .routes.api import api_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(merge_bp)
    app.register_blueprint(split_bp)
    app.register_blueprint(reorder_bp)
    app.register_blueprint(api_bp, url_prefix='/api')

    # Start background cleanup thread
    from .services.cleanup_service import start_cleanup_scheduler
    start_cleanup_scheduler(app)

    return app
