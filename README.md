# Developer Toolbox

A modular, extensible web application hosting various developer utilities. Built with Flask and designed with a premium UI.

## Tools Included

1.  **Transparent QR Code Generator**: Create QR codes with transparent backgrounds, perfect for overlays.
2.  **PDF to Transparent PNG**: Convert PDF pages into transparent PNG images, automatically removing white backgrounds.

## Installation

### Prerequisites

1.  **Python 3.8+**
2.  **Poppler**: Required for PDF processing.
    *   **Windows**: Download the binary from [github.com/oschwartz10612/poppler-windows/releases](https://github.com/oschwartz10612/poppler-windows/releases), extract it, and add the `bin` folder to your System PATH environment variable.
    *   **Mac**: `brew install poppler`
    *   **Linux**: `sudo apt-get install poppler-utils`

### Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Usage

1.  Start the Flask server:
    ```bash
    python app.py
    ```
2.  Open your browser and navigate to `http://127.0.0.1:8080`.

## Contributing / Adding New Tools

This project is designed to be easily extensible using **Flask Blueprints**.

1.  **Create Logic**: Create a new file in `tools/` (e.g., `my_tool.py`).
2.  **Define Blueprint**:
    ```python
    from flask import Blueprint, render_template
    my_bp = Blueprint('my_tool', __name__)
    # ... define routes ...
    ```
3.  **Create Template**: Add a new HTML file in `templates/tools/`.
4.  **Register**: Open `tools/registry.py` and add your tool's details to the `TOOLS` list.
    ```python
    {
        'id': 'my_tool',
        'title': 'My New Tool',
        'description': 'Description here.',
        'icon': 'fa-solid fa-wrench', # FontAwesome icon class
        'endpoint': 'my_tool.index'
    }
    ```
5.  **Import**: In `tools/registry.py`, import your blueprint in the `register_tools` function and register it.

The homepage will automatically update to display your new tool card!
