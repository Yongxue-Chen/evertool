FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# poppler-utils: pdf2image shells out to pdftoppm
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run unprivileged. The only path the app writes to is static/temp (converted
# PDF pages, removed after an hour); everything else stays read-only.
RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin evertool \
    && chmod -R a+rX /app \
    && mkdir -p /app/static/temp && chown evertool:evertool /app/static/temp
USER evertool

EXPOSE 8080

# Serve with gunicorn (no debug server); PDF conversion can be slow, hence the long timeout
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "300", "--worker-tmp-dir", "/dev/shm", "app:app"]
