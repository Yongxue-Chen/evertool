# evertool — Developer Toolbox

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A modular, extensible web application hosting various developer utilities. Built with Flask and designed with a premium UI.

## Tools Included

1. **Transparent QR Code Generator** — Create QR codes with transparent backgrounds, perfect for overlays.
2. **PDF to Transparent PNG** — Convert PDF pages into transparent PNG images, automatically removing white backgrounds.
3. **Alpha Mask Processor** — Apply smooth, SDF-based alpha mask transitions (rounded corners + feathered edges) to PNG images, right in the browser. Ported from [TransitionalAlphaMaskProcessor](https://github.com/aaron6172/TransitionalAlphaMaskProcessor) — see [Credits](#credits).

## Quick Start

### Prerequisites

1. **Python 3.8+**
2. **Poppler** (required for PDF processing)
   - **Windows**: Download the binary from [oschwartz10612/poppler-windows](https://github.com/oschwartz10612/poppler-windows/releases), extract it, and add the `bin` folder to your `PATH`.
   - **macOS**: `brew install poppler`
   - **Linux**: `sudo apt-get install poppler-utils`

### Setup

```bash
git clone https://github.com/Yongxue-Chen/toolbox.git
cd toolbox
pip install -r requirements.txt
```

### Run

```bash
python app.py
```

Then open `http://127.0.0.1:8080` in your browser.

### Run with Docker

```bash
docker build -t toolbox-app .
docker run -p 8080:8080 toolbox-app
```

For a guided walkthrough of deploying with [1Panel](https://1panel.cn/), see [DEPLOY_1PANEL.md](DEPLOY_1PANEL.md).

## Architecture

This project is designed to be easily extensible using **Flask Blueprints**. Each tool lives in its own module under `tools/`, with its own template(s) under `templates/tools/` and, if needed, its own static assets under `static/tools/<tool_id>/`.

```
toolbox/
├── app.py                 # App entry point
├── tools/                 # One module per tool (Flask Blueprints)
│   ├── registry.py        # Central list of registered tools
│   ├── qr_tool.py
│   ├── pdf_tool.py
│   └── mask_tool.py
├── templates/
│   ├── base.html          # Shared layout (header/footer/nav)
│   ├── index.html         # Tool gallery / homepage
│   └── tools/              # Per-tool templates
├── static/
│   ├── css/, js/, img/    # Shared assets
│   └── tools/             # Per-tool assets (e.g. self-contained JS apps)
└── Dockerfile
```

## Adding a New Tool

1. **Create logic**: add a new file in `tools/` (e.g. `my_tool.py`).
2. **Define a Blueprint**:
   ```python
   from flask import Blueprint, render_template
   my_bp = Blueprint('my_tool', __name__)
   # ... define routes ...
   ```
3. **Create a template**: add a new HTML file under `templates/tools/`.
4. **Register it**: open `tools/registry.py`, add your tool to the `TOOLS` list, and register the blueprint in `register_tools()`:
   ```python
   {
       'id': 'my_tool',
       'title': 'My New Tool',
       'description': 'Description here.',
       'icon': 'fa-solid fa-wrench',  # FontAwesome icon class
       'endpoint': 'my_tool.index'
   }
   ```

The homepage will automatically pick up your new tool card.

## Contributing

Issues and pull requests are welcome. If you're adding a new tool, please follow the Blueprint pattern above and keep third-party code properly attributed and licensed (see below).

## Credits

- **Alpha Mask Processor** is adapted from [aaron6172/TransitionalAlphaMaskProcessor](https://github.com/aaron6172/TransitionalAlphaMaskProcessor), a vanilla-JS, canvas-based tool for applying SDF alpha mask transitions to images. Many thanks to the original author for releasing it under the MIT License.

## License

This project is licensed under the [MIT License](LICENSE).
