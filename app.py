import os
from flask import Flask, render_template
from tools.registry import TOOLS, register_tools

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_key')  # Set SECRET_KEY in production

# Register Blueprints
register_tools(app)

@app.route('/')
def index():
    return render_template('index.html', tools=TOOLS)

if __name__ == '__main__':
    # Local development only; the container runs gunicorn (see Dockerfile).
    app.run(debug=os.environ.get('FLASK_DEBUG') == '1', port=8080, host='127.0.0.1')
