"""
Registry for toolbox tools.
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
        'title': 'Transparent QR Code',
        'description': 'Generate QR codes with transparent backgrounds.',
        'icon': 'fa-qrcode',
        'endpoint': 'qr.index' # Flask endpoint for the tool's page
    },
    {
        'id': 'pdf',
        'title': 'PDF to Transparent PNG',
        'description': 'Convert PDF pages to transparent PNGs.',
        'icon': 'fa-file-pdf',
        'endpoint': 'pdf.index'
    }
]

def register_tools(app):
    """Register tool blueprints with the Flask app."""
    from tools.qr_tool import qr_bp
    from tools.pdf_tool import pdf_bp
    app.register_blueprint(qr_bp, url_prefix='/tool/qr')
    app.register_blueprint(pdf_bp, url_prefix='/tool/pdf')
