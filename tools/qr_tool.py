from flask import Blueprint, render_template, request, flash
import qrcode
import io
import base64

from tools.imaging import white_to_transparent

qr_bp = Blueprint('qr', __name__)

@qr_bp.route('/')
def index():
    return render_template('tools/qr.html')

@qr_bp.route('/generate', methods=['POST'])
def generate():
    url = request.form.get('url')
    if not url:
        flash('Please enter a URL', 'error')
        return render_template('tools/qr.html')

    # Get background preference
    background = request.form.get('background', 'transparent')

    try:
        # Generate QRCode
        qr = qrcode.QRCode(
            version=3,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)

        # Create RGBA image with white background first
        img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")

        # Apply transparency if requested
        if background == 'transparent':
            img = white_to_transparent(img)
        # Else: keep white background (already set by back_color="white")

        # Save to BytesIO
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        
        # Convert to Base64
        img_b64 = base64.b64encode(img_io.getvalue()).decode('utf-8')
        img_data = f"data:image/png;base64,{img_b64}"

        return render_template('tools/qr.html', result_image=img_data, filename='transparent_qr.png')

    except Exception as e:
        flash(f'Error generating QR Code: {str(e)}', 'error')
        return render_template('tools/qr.html')
