/* ============================================================
   split.js — Split page logic
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

  // ── State ────────────────────────────────────────────────
  let fileId    = null;
  let pageCount = 0;
  let selected  = new Set();  // 0-indexed page numbers
  let mode      = 'visual';   // 'visual' | 'range'

  // ── DOM refs ─────────────────────────────────────────────
  const uploadSection   = document.getElementById('splitUploadSection');
  const workspace       = document.getElementById('splitWorkspace');
  const fileName        = document.getElementById('splitFileName');
  const fileMeta        = document.getElementById('splitFileMeta');
  const changeFileBtn   = document.getElementById('splitChangeFile');
  const visualPanel     = document.getElementById('splitVisualPanel');
  const rangePanel      = document.getElementById('splitRangePanel');
  const thumbnailGrid   = document.getElementById('splitThumbnailGrid');
  const selectedCount   = document.getElementById('splitSelectedCount');
  const selectAllBtn    = document.getElementById('splitSelectAll');
  const deselectAllBtn  = document.getElementById('splitDeselectAll');
  const rangeInput      = document.getElementById('splitRangeInput');
  const extractBtn      = document.getElementById('splitExtractBtn');
  const splitAllBtn     = document.getElementById('splitAllBtn');
  const progressWrap    = document.getElementById('splitProgress');
  const progressBar     = document.getElementById('splitProgressBar');
  const progressLabel   = document.getElementById('splitProgressLabel');

  if (!document.getElementById('splitUploadZone')) return;

  // ── Upload ────────────────────────────────────────────────
  UploadZone.init('splitUploadZone', 'splitFileInput', {
    multiple: false,
    onFiles: function (files) { handleUpload(files[0]); },
  });

  async function handleUpload(file) {
    // Reset state
    fileId = null;
    selected.clear();
    thumbnailGrid.innerHTML = '';
    renderSkeletons(6);

    try {
      const data = await UploadZone.uploadFile(file, function () {});

      fileId    = data.file_id;
      pageCount = data.page_count;

      fileName.textContent = data.original_name;
      fileMeta.textContent = `${data.page_count} pages · ${Utils.formatBytes(data.file_size)}`;

      uploadSection.classList.add('hidden');
      workspace.classList.remove('hidden');

      renderThumbnails(data.thumbnails, data.page_count);
      updateSelectedCount();

    } catch (err) {
      uploadSection.classList.remove('hidden');
      workspace.classList.add('hidden');
      thumbnailGrid.innerHTML = '';
      Toast.error('Upload failed', err.message);
    }
  }

  // ── Thumbnails ────────────────────────────────────────────
  function renderSkeletons(n) {
    thumbnailGrid.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const card = document.createElement('div');
      card.className = 'thumbnail-card';
      card.innerHTML = `<div class="thumbnail-skeleton"></div>
        <div class="thumbnail-footer"><span class="thumbnail-label">Page ${i + 1}</span></div>`;
      thumbnailGrid.appendChild(card);
    }
  }

  function renderThumbnails(thumbnails, total) {
    thumbnailGrid.innerHTML = '';
    for (let i = 0; i < total; i++) {
      thumbnailGrid.appendChild(buildThumbCard(i, thumbnails[i]));
    }
  }

  function buildThumbCard(idx, thumbData) {
    const card = document.createElement('div');
    card.className = 'thumbnail-card';
    card.dataset.pageIdx = idx;
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Page ${idx + 1}, click to select`);
    card.setAttribute('aria-pressed', 'false');

    const imgSrc = thumbData
      ? `data:image/jpeg;base64,${thumbData}`
      : '';

    card.innerHTML = `
      <div class="thumbnail-img-wrapper">
        ${imgSrc
          ? `<img src="${imgSrc}" alt="Page ${idx + 1} preview" loading="lazy">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-surface-2);color:var(--text-secondary);font-size:0.8rem">Page ${idx + 1}</div>`}
        <span class="thumbnail-check" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
      </div>
      <div class="thumbnail-footer">
        <span class="thumbnail-label">Page ${idx + 1}</span>
      </div>`;

    card.addEventListener('click',   () => togglePage(idx, card));
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePage(idx, card); }
    });

    return card;
  }

  function togglePage(idx, card) {
    if (selected.has(idx)) {
      selected.delete(idx);
      card.classList.remove('selected');
      card.setAttribute('aria-pressed', 'false');
    } else {
      selected.add(idx);
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
    }
    updateSelectedCount();
  }

  function updateSelectedCount() {
    const n = selected.size;
    if (selectedCount) selectedCount.textContent = n + (n === 1 ? ' selected' : ' selected');
    extractBtn.disabled = n === 0;
  }

  // Select / deselect all
  selectAllBtn && selectAllBtn.addEventListener('click', function () {
    selected.clear();
    for (let i = 0; i < pageCount; i++) selected.add(i);
    thumbnailGrid.querySelectorAll('.thumbnail-card').forEach(c => {
      c.classList.add('selected');
      c.setAttribute('aria-pressed', 'true');
    });
    updateSelectedCount();
  });

  deselectAllBtn && deselectAllBtn.addEventListener('click', function () {
    selected.clear();
    thumbnailGrid.querySelectorAll('.thumbnail-card').forEach(c => {
      c.classList.remove('selected');
      c.setAttribute('aria-pressed', 'false');
    });
    updateSelectedCount();
  });

  // ── Mode toggle ───────────────────────────────────────────
  document.querySelectorAll('input[name="splitMode"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      mode = this.value;
      document.getElementById('modeVisualLabel').classList.toggle('selected', mode === 'visual');
      document.getElementById('modeRangeLabel').classList.toggle('selected', mode === 'range');
      visualPanel.classList.toggle('hidden', mode !== 'visual');
      rangePanel.classList.toggle('hidden', mode !== 'range');
    });
  });

  // ── Change file ───────────────────────────────────────────
  changeFileBtn && changeFileBtn.addEventListener('click', function () {
    if (fileId) {
      fetch('/api/files/' + fileId, { method: 'DELETE' }).catch(() => {});
    }
    fileId = null;
    selected.clear();
    workspace.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    thumbnailGrid.innerHTML = '';
  });

  // ── Extract selected ──────────────────────────────────────
  extractBtn && extractBtn.addEventListener('click', async function () {
    let pages;

    if (mode === 'visual') {
      if (selected.size === 0) {
        Toast.warning('No pages selected', 'Click on page thumbnails to select them.');
        return;
      }
      pages = Array.from(selected).sort((a, b) => a - b).map(i => i + 1);
    } else {
      const raw = rangeInput ? rangeInput.value.trim() : '';
      if (!raw) {
        Toast.warning('No pages entered', 'Enter a page range like 1-3, 5, 8-12.');
        return;
      }
      pages = raw; // send as string, server parses it
    }

    await doSplit({ mode: 'pages', pages });
  });

  // ── Split all ─────────────────────────────────────────────
  splitAllBtn && splitAllBtn.addEventListener('click', async function () {
    await doSplit({ mode: 'all' });
  });

  async function doSplit(opts) {
    if (!fileId) return;

    progressWrap.classList.remove('hidden');
    extractBtn.disabled = true;
    splitAllBtn.disabled = true;
    Utils.setProgress(progressBar, progressLabel, 40, 'Extracting pages...');

    try {
      const body = { file_id: fileId };
      if (opts.mode === 'all') {
        body.mode = 'all';
      } else {
        body.mode = 'pages';
        body.pages = opts.pages;
      }

      const resp = await fetch('/api/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Split failed');

      Utils.setProgress(progressBar, progressLabel, 100, 'Done! Starting download...');
      Toast.success('Split complete!',
        opts.mode === 'all'
          ? 'Pages saved as ZIP archive.'
          : `${data.page_count} page(s) extracted.`);

      setTimeout(function () {
        Utils.triggerDownload(data.result_id, data.filename);
        progressWrap.classList.add('hidden');
        Utils.setProgress(progressBar, null, 0);
      }, 600);

    } catch (err) {
      Toast.error('Split failed', err.message);
      progressWrap.classList.add('hidden');
    } finally {
      updateSelectedCount();
      splitAllBtn.disabled = false;
    }
  }

  // Init
  extractBtn && (extractBtn.disabled = true);
});
