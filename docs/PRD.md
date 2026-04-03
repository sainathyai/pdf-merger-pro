# Product Requirements Document (PRD)
# PDF Merger Pro — Web-Based PDF Toolkit

**Version:** 1.0  
**Date:** 2026-04-01  
**Author:** Sainatha Yatham  
**Status:** Draft

---

## 1. Overview

PDF Merger Pro is a web-based application that enables users to merge, split, reorder, rotate, and manage PDF files through an intuitive drag-and-drop interface. Built with Python (Flask) on the backend and a modern responsive frontend, it provides a fast, private, and free alternative to online PDF tools.

### 1.1 Problem Statement

Users frequently need to combine, split, or rearrange PDF documents but are forced to rely on:
- Paid desktop software (Adobe Acrobat)
- Online tools that upload files to third-party servers (privacy concern)
- Command-line tools that are not user-friendly

### 1.2 Solution

A self-hosted, web-based PDF toolkit that runs locally or on a private server — keeping files secure while providing a polished, modern user experience.

### 1.3 Target Users

- Professionals handling contracts, reports, and invoices
- Students combining lecture notes and assignments
- Small businesses managing documentation workflows
- Anyone who values privacy and doesn't want to upload PDFs to third-party sites

---

## 2. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Fast PDF processing | Merge 10 files (50 pages each) in < 3 seconds |
| Intuitive UX | User can merge files within 30 seconds on first visit |
| File privacy | Zero files stored permanently on server |
| Reliability | Handle PDFs up to 100MB without failure |
| Responsiveness | Fully usable on mobile and tablet |

---

## 3. Core Features (MVP — v1.0)

### 3.1 PDF Merge
- Upload multiple PDF files via drag-and-drop or file picker
- Reorder files via drag-and-drop before merging
- Merge all files into a single PDF
- Download the merged result
- Option to name the output file

### 3.2 PDF Split
- Upload a single PDF
- Visual page-by-page preview (thumbnails)
- Select specific pages or page ranges (e.g., "1-3, 5, 8-12")
- Extract selected pages into a new PDF
- Split into individual pages (one PDF per page)

### 3.3 Page Reorder & Rotate
- Thumbnail grid view of all pages
- Drag-and-drop to reorder pages
- Rotate individual pages (90°, 180°, 270°)
- Delete specific pages
- Save reordered/modified PDF

### 3.4 PDF Preview
- Thumbnail previews of uploaded files
- Page count and file size display
- Quick preview modal for individual pages

### 3.5 File Management
- Drag-and-drop upload zone
- Multi-file selection from file picker
- File size validation (max 100MB per file, 500MB total)
- File type validation (PDF only)
- Auto-cleanup of temporary files after download or session timeout

---

## 4. Enhanced Features (v1.1)

### 4.1 PDF Compression
- Reduce file size of output PDFs
- Three compression levels: Low, Medium, High
- Display before/after file sizes

### 4.2 PDF Security
- Add password protection to output PDF
- Remove password from uploaded PDF (requires current password)
- Set permissions (print, copy, edit)

### 4.3 PDF Metadata
- View metadata (title, author, creation date)
- Edit metadata before saving
- Strip all metadata for privacy

### 4.4 Image to PDF
- Upload images (JPG, PNG, WEBP)
- Convert and combine into a single PDF
- Adjust page size and orientation per image

### 4.5 Watermark
- Add text or image watermark to all pages
- Configure position, opacity, rotation, font size

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Backend | Flask (Python 3.11+) | Lightweight, well-documented, great for file handling |
| PDF Engine | pypdf | Modern, actively maintained, pure Python |
| Thumbnails | pdf2image + Pillow | Reliable PDF-to-image rendering |
| Frontend | HTML5, CSS3, JavaScript (vanilla) | No build step, fast loading, minimal dependencies |
| CSS Framework | Bootstrap 5 | Responsive, modern components, dark mode support |
| Drag & Drop | SortableJS | Lightweight, touch-friendly, well-tested |
| File Upload | Dropzone.js or custom | Drag-and-drop with progress indication |
| Icons | Bootstrap Icons or Lucide | Clean, consistent iconography |
| Temp Storage | Python tempfile + scheduled cleanup | Auto-cleanup, no permanent storage |

### 5.2 Project Structure

```
Pdfmerger/
├── app/
│   ├── __init__.py            # Flask app factory
│   ├── config.py              # Configuration settings
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── merge.py           # Merge endpoints
│   │   ├── split.py           # Split endpoints
│   │   ├── reorder.py         # Reorder/rotate endpoints
│   │   └── preview.py         # Preview/thumbnail endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── pdf_service.py     # Core PDF operations
│   │   ├── thumbnail_service.py # Thumbnail generation
│   │   └── cleanup_service.py # Temp file cleanup
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css      # Custom styles
│   │   ├── js/
│   │   │   ├── app.js         # Main application logic
│   │   │   ├── upload.js      # File upload handling
│   │   │   ├── merge.js       # Merge page logic
│   │   │   ├── split.js       # Split page logic
│   │   │   └── reorder.js     # Reorder page logic
│   │   └── img/
│   │       └── logo.svg       # Application logo
│   └── templates/
│       ├── base.html           # Base layout template
│       ├── index.html          # Landing page
│       ├── merge.html          # Merge tool page
│       ├── split.html          # Split tool page
│       └── reorder.html        # Reorder tool page
├── docs/
│   ├── PRD.md                  # This document
│   └── UI_DESIGN.md            # UI/UX design specification
├── tests/
│   ├── test_merge.py
│   ├── test_split.py
│   └── test_reorder.py
├── requirements.txt
├── run.py                      # Application entry point
└── README.md
```

### 5.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Landing page |
| GET | `/merge` | Merge tool page |
| POST | `/api/merge` | Merge uploaded PDFs |
| GET | `/split` | Split tool page |
| POST | `/api/split` | Split PDF by page selection |
| GET | `/reorder` | Reorder tool page |
| POST | `/api/upload` | Upload PDF and get thumbnails |
| POST | `/api/reorder` | Save reordered/rotated PDF |
| GET | `/api/preview/<id>/<page>` | Get page thumbnail |
| GET | `/api/download/<id>` | Download processed PDF |
| DELETE | `/api/files/<id>` | Delete uploaded file |

### 5.4 File Flow

```
User Upload → Temp Storage → Processing → Result in Temp → Download → Auto-Cleanup
                  │                                              │
                  └── Thumbnails generated ──────────────────────┘
                       (cached in temp)                    (cleanup after 30 min)
```

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Page load time: < 1 second
- Thumbnail generation: < 500ms per page
- Merge operation: < 3 seconds for 10 files
- Max concurrent users: 10 (self-hosted target)

### 6.2 Security
- No permanent file storage — all files auto-deleted
- Session-based file isolation (users can only access their own files)
- Input validation on all uploads (file type, size, content)
- CSRF protection on all forms
- No external API calls — fully self-contained

### 6.3 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigable
- Screen reader friendly
- Sufficient color contrast
- Focus indicators on interactive elements

### 6.4 Browser Support
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome for Android)

---

## 7. User Stories

### Merge
- **US-1**: As a user, I want to drag and drop multiple PDF files so I can quickly start merging.
- **US-2**: As a user, I want to reorder files before merging so the output is in my desired sequence.
- **US-3**: As a user, I want to name the output file so I can identify it easily.
- **US-4**: As a user, I want to see file names and sizes so I know what I'm merging.

### Split
- **US-5**: As a user, I want to see thumbnails of all pages so I can visually select which pages to extract.
- **US-6**: As a user, I want to type page ranges (e.g., "1-3, 5") so I can quickly select non-contiguous pages.
- **US-7**: As a user, I want to split a PDF into individual pages so I can share specific pages.

### Reorder
- **US-8**: As a user, I want to drag and drop page thumbnails to reorder them visually.
- **US-9**: As a user, I want to rotate a page so I can fix orientation issues.
- **US-10**: As a user, I want to delete specific pages so I can remove unwanted content.

### General
- **US-11**: As a user, I want my files to be automatically deleted so my data stays private.
- **US-12**: As a user, I want the app to work on my phone so I can process PDFs on the go.
- **US-13**: As a user, I want a dark mode so I can use the app comfortably at night.

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large PDF files causing memory issues | High | Stream processing, file size limits, chunked uploads |
| Corrupted PDFs crashing the app | Medium | Try/catch with user-friendly error messages |
| Temp files filling disk space | Medium | Aggressive cleanup scheduler (every 15 min) |
| Poppler not installed (for thumbnails) | Low | Graceful fallback to placeholder thumbnails, clear install instructions |
| Concurrent users overloading server | Low | Rate limiting, queue system for large files |

---

## 9. Release Plan

### v1.0 — MVP (Current Scope)
- Merge, Split, Reorder/Rotate
- Drag-and-drop UI with previews
- Dark/Light mode
- Auto file cleanup
- Mobile responsive

### v1.1 — Enhanced
- Compression
- Password protection
- Image to PDF
- Metadata editing

### v1.2 — Advanced
- Watermarking
- Batch operations
- OCR text extraction
- PDF form filling

---

## 10. Open Questions

1. Should we support concurrent multi-tab sessions for the same user?
2. Do we want to add user accounts / history in a future version?
3. Should we support cloud storage integration (Google Drive, Dropbox)?
4. Is there a need for a CLI mode alongside the web UI?
