from flask import Flask, render_template
from tools.registry import TOOLS, register_tools

app = Flask(__name__)
app.secret_key = 'dev_key'  # Change for production

# Register Blueprints
register_tools(app)

@app.route('/')
def index():
    return render_template('index.html', tools=TOOLS)

if __name__ == '__main__':
    app.run(debug=True, port=8080, host='0.0.0.0')
