# ── Build stage ──────────────────────────────────────────────
FROM python:3.11-slim AS base

# Install Poppler (required for pdf2image) and clean up
RUN apt-get update && apt-get install -y --no-install-recommends \
        poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# ── Runtime config ────────────────────────────────────────────
# Cloud Run injects PORT; default to 8080
ENV PORT=8080
ENV FLASK_ENV=production

# Gunicorn: 1 worker per vCPU recommendation for Cloud Run
# --timeout 120 handles large PDF uploads
CMD exec gunicorn \
        --bind "0.0.0.0:${PORT}" \
        --workers 2 \
        --threads 4 \
        --timeout 120 \
        --access-logfile - \
        "app:create_app('production')"
