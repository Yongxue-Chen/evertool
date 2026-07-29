from flask import Blueprint, render_template

mask_bp = Blueprint('mask', __name__)


@mask_bp.route('/')
def index():
    return render_template('tools/mask.html')
