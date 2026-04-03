# PDF Pro

**Free online PDF toolkit — Merge, Split & Reorder PDFs privately.**

Live at [pdf.aspenitservices.com](https://pdf.aspenitservices.com)

---

## Features

| Tool | Description |
|---|---|
| **Merge** | Combine multiple PDFs into one. Drag to reorder files before merging. |
| **Split** | Extract pages or page ranges from any PDF into separate files. |
| **Reorder** | Rearrange pages within a PDF using drag-and-drop thumbnails. |

- No sign-up required
- Files processed server-side and immediately discarded — never stored
- Dark / light mode
- Mobile responsive

---

## Tech Stack

- **Backend:** Python 3.11, Flask, pypdf, pdf2image (Poppler)
- **Frontend:** Vanilla JS, SortableJS (drag-and-drop)
- **Infrastructure:** Docker, Google Cloud Run, Cloud Build

---

## Local Development

```bash
# Clone
git clone git@github.com:sainathyai/pdf-merger-pro.git
cd pdf-merger-pro

# Install dependencies
pip install -r requirements.txt

# Run
python run.py
# → http://localhost:5000
```

Requires [Poppler](https://poppler.freedesktop.org/) for PDF thumbnails:
- **macOS:** `brew install poppler`
- **Ubuntu:** `apt-get install poppler-utils`
- **Windows:** [poppler for Windows](https://github.com/oschwartz10612/poppler-windows/releases)

---

## Deployment

Deployed to Google Cloud Run via source deploy:

```bash
gcloud run deploy pdfmerger-pro \
  --source . \
  --region us-central1 \
  --project pdfmerger-pro-app
```

---

## Project Structure

```
app/
  routes/       # merge.py, split.py, reorder.py, api.py
  services/     # pdf_service.py, thumbnail_service.py, cleanup_service.py
  static/       # CSS, JS, assets
  templates/    # Jinja2 HTML templates
docs/           # PRD and UI design spec
tests/
Dockerfile
requirements.txt
```

---

Part of the [Veritas Intel](https://veritasintelai.com) tools ecosystem.
