"""
Registry for evertool tools.
To add a new tool:
1. Import the blueprint.
2. Add a dictionary to the TOOLS list.
"""

# Import blueprints (to be created)
# from tools.qr_tool import qr_bp
# from tools.pdf_tool import pdf_bp

TOOLS = [
    {
        'id': 'qr',
        'title': 'Generate QR Code',
        'description': 'Generate QR codes with customizable backgrounds.',
        'icon': 'fa-qrcode',
        'endpoint': 'qr.index' # Flask endpoint for the tool's page
    },
    {
        'id': 'pdf',
        'title': 'PDF to Transparent PNG',
        'description': 'Convert PDF pages to transparent PNGs.',
        'icon': 'fa-file-pdf',
        'endpoint': 'pdf.index'
    },
    {
        'id': 'mask',
        'title': 'Alpha Mask Processor',
        'description': 'Apply smooth, SDF-based alpha mask transitions to PNG images.',
        'icon': 'fa-image',
        'endpoint': 'mask.index'
    }
]

def register_tools(app):
    """Register tool blueprints with the Flask app."""
    from tools.qr_tool import qr_bp
    from tools.pdf_tool import pdf_bp
    from tools.mask_tool import mask_bp
    app.register_blueprint(qr_bp, url_prefix='/tool/qr')
    app.register_blueprint(pdf_bp, url_prefix='/tool/pdf')
    app.register_blueprint(mask_bp, url_prefix='/tool/mask')
