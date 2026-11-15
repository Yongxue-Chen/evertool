import os
from flask import Flask, render_template
from tools.registry import TOOLS, register_tools

app = Flask(__name__)

# SECRET_KEY signs the session cookie that carries flash messages. Refuse to
# start without one unless this is an explicit local debug run.
_secret_key = os.environ.get('SECRET_KEY')
if not _secret_key:
    if os.environ.get('FLASK_DEBUG') == '1':
        _secret_key = 'dev_key'
    else:
        raise RuntimeError('SECRET_KEY is not set. Set it in the environment (see .env.example).')
app.secret_key = _secret_key

# Uploads are processed in memory; cap them so one request cannot exhaust it.
app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get('MAX_UPLOAD_MB', '200')) * 1024 * 1024

# Register Blueprints
register_tools(app)

@app.route('/')
def index():
    return render_template('index.html', tools=TOOLS)

if __name__ == '__main__':
    # Local development only; the container runs gunicorn (see Dockerfile).
    app.run(debug=os.environ.get('FLASK_DEBUG') == '1', port=8080, host='127.0.0.1')
