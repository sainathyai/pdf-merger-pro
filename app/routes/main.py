from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def index():
    return render_template('index.html')


@main_bp.route('/tool')
def tool():
    return render_template('tool.html')


@main_bp.route('/merge')
def merge():
    return render_template('merge.html')


@main_bp.route('/split')
def split():
    return render_template('split.html')


@main_bp.route('/reorder')
def reorder():
    return render_template('reorder.html')
