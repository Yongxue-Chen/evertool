from flask import Blueprint, render_template, request, send_file, flash, url_for, current_app
from pdf2image import convert_from_bytes
import io
import zipfile
import os
import uuid
import shutil
import time

from tools.imaging import white_to_transparent

pdf_bp = Blueprint('pdf', __name__)

TEMP_FOLDER = 'static/temp'

def cleanup_old_files():
    """Simple cleanup of files older than 1 hour"""
    try:
        now = time.time()
        root = os.path.join(current_app.root_path, TEMP_FOLDER)
        if not os.path.exists(root):
            return
            
        for filename in os.listdir(root):
            file_path = os.path.join(root, filename)
            if os.path.getmtime(file_path) < now - 3600:
                if os.path.isdir(file_path):
                    shutil.rmtree(file_path)
                else:
                    os.remove(file_path)
    except Exception:
        pass

@pdf_bp.route('/')
def index():
    return render_template('tools/pdf.html')

@pdf_bp.route('/convert', methods=['POST'])
def convert():
    if 'pdf' not in request.files:
        flash('No file uploaded', 'error')
        return render_template('tools/pdf.html')
    
    file = request.files['pdf']
    if file.filename == '':
        flash('No file selected', 'error')
        return render_template('tools/pdf.html')

    if not file.filename.lower().endswith('.pdf'):
        flash('File must be a PDF', 'error')
        return render_template('tools/pdf.html')

    try:
        cleanup_old_files()
        
        # Create unique temp dir
        batch_id = str(uuid.uuid4())
        save_dir = os.path.join(current_app.root_path, TEMP_FOLDER, batch_id)
        os.makedirs(save_dir, exist_ok=True)
        
        # Read file bytes
        pdf_bytes = file.read()
        pages = convert_from_bytes(pdf_bytes, dpi=300)
        
        saved_files = []
        
        for i, page in enumerate(pages):
            img = white_to_transparent(page)

            # Save single image
            filename = f"page_{i+1}.png"
            filepath = os.path.join(save_dir, filename)
            img.save(filepath, "PNG")
            
            # Store relative path for template
            saved_files.append({
                'url': url_for('static', filename=f'temp/{batch_id}/{filename}'),
                'name': filename
            })

        # Create Zip if multiple
        zip_url = None
        if len(saved_files) > 1:
            zip_filename = f"{file.filename}_converted.zip"
            zip_path = os.path.join(save_dir, zip_filename)
            
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for f in saved_files:
                    # Add file to zip (arcname is just filename)
                    abs_path = os.path.join(save_dir, f['name'])
                    zip_file.write(abs_path, f['name'])
            
            zip_url = url_for('static', filename=f'temp/{batch_id}/{zip_filename}')
        
        # If single file, the download link is just that file
        download_url = zip_url if zip_url else saved_files[0]['url']
        download_name = f"{file.filename}_converted.zip" if zip_url else saved_files[0]['name']

        return render_template('tools/pdf.html', 
                             images=saved_files, 
                             download_url=download_url,
                             download_name=download_name)

    except Exception as e:
        error_msg = str(e)
        if "poppler" in error_msg.lower():
            flash('Error: Poppler is not installed. Please install Poppler.', 'error')
        else:
            flash(f'Error processing PDF: {error_msg}', 'error')
        return render_template('tools/pdf.html')
