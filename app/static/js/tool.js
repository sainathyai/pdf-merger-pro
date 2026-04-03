/* ============================================================
   tool.js — Unified PDF workspace
   Upload → preview all pages → drag to reorder → merge / extract
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

  // ── File color palette (teal-first, matches brand) ─────────
  const COLORS = ['#00e5c3', '#f5a623', '#4A9EFF', '#e05cdd', '#9B6FF5', '#4ade80'];

  // ── State ──────────────────────────────────────────────────
  const uploadedFiles = [];
  // { fileId, originalName, filename, pageCount, fileSize, color }

  const pages = [];
  // { uid, fileId, originalName, pageIndex, thumbSrc, selected, color }

  let sortable = null;

  // ── DOM refs ───────────────────────────────────────────────
  const dropzone      = document.getElementById('sidebarDropzone');
  const fileInput     = document.getElementById('toolFileInput');
  const sidebarList   = document.getElementById('sidebarFileList');
  const sidebarHint   = document.getElementById('sidebarEmptyHint');
  const previewEmpty  = document.getElementById('previewEmpty');
  const pageGrid      = document.getElementById('pageGrid');
  const actionBar     = document.getElementById('toolActionBar');
  const actionHint    = document.getElementById('actionHint');
  const outputName    = document.getElementById('toolOutputName');
  const btnMerge      = document.getElementById('btnMerge');
  const btnMergeLabel = document.getElementById('btnMergeLabel');
  const btnSplit      = document.getElementById('btnSplit');
  const btnClear      = document.getElementById('btnClear');

  if (!dropzone) return;

  // ── Dropzone events ────────────────────────────────────────
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (files.length) handleFiles(files);
    else Toast.warning('PDF only', 'Only PDF files are supported.');
  });

  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) handleFiles(Array.from(fileInput.files));
    fileInput.value = '';
  });

  // ── Handle file selection ──────────────────────────────────
  async function handleFiles(files) {
    for (const file of files) {
      const color = COLORS[uploadedFiles.length % COLORS.length];

      // Add placeholder sidebar card immediately
      const sCard = buildSidebarCard({ fileId: '_tmp', originalName: file.name, pageCount: null, fileSize: file.size, color, uploading: true });
      sidebarList.appendChild(sCard);
      refreshUI();

      try {
        const data = await UploadZone.uploadFile(file, () => {});

        const entry = {
          fileId:       data.file_id,
          originalName: data.original_name,
          filename:     data.filename,
          pageCount:    data.page_count,
          fileSize:     data.file_size,
          thumbnails:   data.thumbnails || [],
          color,
        };
        uploadedFiles.push(entry);

        // Update sidebar card with real data
        sCard.dataset.fileId = entry.fileId;
        sCard.querySelector('.sf-meta').textContent =
          entry.pageCount + (entry.pageCount === 1 ? ' page' : ' pages') +
          ' · ' + Utils.formatBytes(entry.fileSize);
        sCard.querySelector('.file-card-remove').setAttribute('aria-label', 'Remove ' + entry.originalName);

        // Append pages to flat list and render in grid
        for (let i = 0; i < entry.pageCount; i++) {
          const uid = entry.fileId + '__' + i;
          pages.push({ uid, fileId: entry.fileId, originalName: entry.originalName,
                       pageIndex: i, thumbSrc: entry.thumbnails[i] || null,
                       selected: false, color });
          pageGrid.appendChild(buildPageCard(uid, i, entry.thumbnails[i], entry.color, entry.originalName));
        }

        initSortable();

      } catch (err) {
        Toast.error('Upload failed', err.message);
        sCard.remove();
      }

      refreshUI();
    }
  }

  // ── Sidebar card ───────────────────────────────────────────
  function buildSidebarCard(entry) {
    const li = document.createElement('li');
    li.className = 'sidebar-file-card';
    li.dataset.fileId = entry.fileId;
    li.setAttribute('role', 'listitem');

    li.innerHTML = `
      <span class="sf-dot" style="background:${entry.color}" aria-hidden="true"></span>
      <div class="sf-info">
        <p class="sf-name" title="${_esc(entry.originalName)}">${_esc(entry.originalName)}</p>
        <p class="sf-meta">${entry.uploading ? 'Uploading…' : ''}</p>
      </div>
      <button class="file-card-remove" type="button" aria-label="Remove file">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
        </svg>
      </button>`;

    li.querySelector('.file-card-remove').addEventListener('click', () => removeFile(li.dataset.fileId));
    return li;
  }

  // ── Page card ──────────────────────────────────────────────
  function buildPageCard(uid, pageIndex, thumbData, color, originalName) {
    const div = document.createElement('div');
    div.className = 'page-thumb-card';
    div.dataset.uid = uid;
    div.setAttribute('role', 'listitem');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-pressed', 'false');
    div.setAttribute('aria-label', 'Page ' + (pageIndex + 1) + ' from ' + originalName);

    const imgSrc = thumbData ? 'data:image/jpeg;base64,' + thumbData : null;

    div.innerHTML = `
      <div class="ptc-img" style="border-top:3px solid ${color}">
        ${imgSrc
          ? `<img src="${imgSrc}" alt="Page ${pageIndex + 1}" loading="lazy">`
          : `<div class="ptc-placeholder">Page ${pageIndex + 1}</div>`}
        <div class="ptc-check-overlay" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>
      <div class="ptc-footer">
        <span class="ptc-num">Page ${pageIndex + 1}</span>
        <span class="ptc-file">${_esc(_shortName(originalName))}</span>
      </div>`;

    div.addEventListener('click', () => toggleSelect(div));
    div.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(div); }
    });

    return div;
  }

  // ── Toggle page selection ──────────────────────────────────
  function toggleSelect(card) {
    const page = pages.find(p => p.uid === card.dataset.uid);
    if (!page) return;
    page.selected = !page.selected;
    card.classList.toggle('selected', page.selected);
    card.setAttribute('aria-pressed', String(page.selected));
    refreshActionState();
  }

  // ── Remove file ────────────────────────────────────────────
  function removeFile(fileId) {
    // Delete from server
    fetch('/api/files/' + fileId, { method: 'DELETE' }).catch(() => {});

    // Remove from uploadedFiles
    const idx = uploadedFiles.findIndex(f => f.fileId === fileId);
    if (idx >= 0) uploadedFiles.splice(idx, 1);

    // Remove pages from state + DOM
    for (let i = pages.length - 1; i >= 0; i--) {
      if (pages[i].fileId === fileId) {
        const card = pageGrid.querySelector('[data-uid="' + pages[i].uid + '"]');
        if (card) card.remove();
        pages.splice(i, 1);
      }
    }

    // Remove sidebar card
    const sCard = sidebarList.querySelector('[data-file-id="' + fileId + '"]');
    if (sCard) sCard.remove();

    refreshUI();
  }

  // ── Sortable drag-to-reorder pages ────────────────────────
  function initSortable() {
    if (sortable) return;
    if (typeof Sortable === 'undefined') return;
    sortable = Sortable.create(pageGrid, {
      animation: 150,
      ghostClass: 'ptc-ghost',
      chosenClass: 'ptc-chosen',
      onEnd: refreshActionState,
    });
  }

  // ── Refresh full UI state ──────────────────────────────────
  function refreshUI() {
    const hasFiles = uploadedFiles.length > 0;
    const hasPages = pages.length > 0;

    sidebarHint.classList.toggle('hidden', hasFiles || sidebarList.children.length > 0);
    previewEmpty.classList.toggle('hidden', hasPages);
    pageGrid.classList.toggle('hidden', !hasPages);
    actionBar.classList.toggle('hidden', !hasFiles);

    refreshActionState();
  }

  function refreshActionState() {
    const selectedPages = pages.filter(p => p.selected);
    const fileCount = uploadedFiles.length;

    btnMerge.disabled = fileCount === 0;
    btnSplit.disabled = selectedPages.length === 0;

    // Dynamic merge button label
    if (fileCount > 1) {
      btnMergeLabel.textContent = 'Merge & Download';
    } else if (fileCount === 1) {
      btnMergeLabel.textContent = 'Download PDF';
    }

    // Status hint
    const sel = selectedPages.length;
    if (sel > 0) {
      actionHint.textContent = sel + (sel === 1 ? ' page selected' : ' pages selected');
    } else if (fileCount > 1) {
      actionHint.textContent = fileCount + ' files · ' + pages.length + ' pages total';
    } else if (fileCount === 1) {
      actionHint.textContent = pages.length + ' pages · drag to reorder · click to select';
    } else {
      actionHint.textContent = '';
    }
  }

  // ── Merge / Download ───────────────────────────────────────
  btnMerge.addEventListener('click', async function () {
    if (uploadedFiles.length === 0) return;
    const outName = (outputName.value || 'output').trim();
    const origLabel = btnMergeLabel.textContent;

    btnMerge.disabled = true;
    btnMergeLabel.textContent = 'Processing…';

    try {
      let resultId, filename, msg;

      if (uploadedFiles.length === 1) {
        // Single file — apply current page order
        const fileId = uploadedFiles[0].fileId;
        const pageOrder = _currentPageOrder(fileId);

        const resp = await fetch('/api/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_id: fileId, page_order: pageOrder }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Failed');
        resultId = data.result_id;
        filename  = outName + '.pdf';
        msg = data.page_count + ' pages saved.';

      } else {
        // Multiple files — merge in sidebar order
        const orderedIds = uploadedFiles.map(f => f.fileId);
        const resp = await fetch('/api/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_ids: orderedIds, output_name: outName }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Failed');
        resultId = data.result_id;
        filename  = data.filename || outName + '.pdf';
        msg = data.page_count + ' pages across ' + uploadedFiles.length + ' files merged.';
      }

      Toast.success('Done!', msg);
      Utils.triggerDownload(resultId, filename);

    } catch (err) {
      Toast.error('Failed', err.message);
    } finally {
      btnMerge.disabled = false;
      btnMergeLabel.textContent = origLabel;
      refreshActionState();
    }
  });

  // ── Extract selected pages ─────────────────────────────────
  btnSplit.addEventListener('click', async function () {
    const selected = pages.filter(p => p.selected);
    if (selected.length === 0) return;

    const uniqueFiles = [...new Set(selected.map(p => p.fileId))];
    if (uniqueFiles.length > 1) {
      Toast.warning('Multiple files selected',
        'To extract pages from multiple files: merge them first, then select pages to extract.');
      return;
    }

    const outName = (outputName.value || 'output').trim();
    const fileId = uniqueFiles[0];
    const pageNums = selected.map(p => p.pageIndex + 1).sort((a, b) => a - b);

    btnSplit.disabled = true;
    const origHtml = btnSplit.innerHTML;
    btnSplit.innerHTML = `<span class="spinner" style="width:14px;height:14px;border-width:2px;flex-shrink:0"></span> Extracting…`;

    try {
      const resp = await fetch('/api/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId, mode: 'pages', pages: pageNums }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed');

      Toast.success('Extracted!', data.page_count + ' page(s) saved.');
      Utils.triggerDownload(data.result_id, outName + '.pdf');

    } catch (err) {
      Toast.error('Failed', err.message);
    } finally {
      btnSplit.innerHTML = origHtml;
      refreshActionState();
    }
  });

  // ── Clear all ──────────────────────────────────────────────
  btnClear.addEventListener('click', function () {
    uploadedFiles.forEach(f => fetch('/api/files/' + f.fileId, { method: 'DELETE' }).catch(() => {}));
    uploadedFiles.length = 0;
    pages.length = 0;
    pageGrid.innerHTML = '';
    sidebarList.innerHTML = '';
    if (sortable) { sortable.destroy(); sortable = null; }
    refreshUI();
  });

  // ── Helpers ────────────────────────────────────────────────
  function _currentPageOrder(fileId) {
    // Read order from DOM (SortableJS may have reordered cards)
    return Array.from(pageGrid.querySelectorAll('.page-thumb-card'))
      .filter(c => {
        const page = pages.find(p => p.uid === c.dataset.uid);
        return page && page.fileId === fileId;
      })
      .map(c => {
        const page = pages.find(p => p.uid === c.dataset.uid);
        return page ? page.pageIndex : 0;
      });
  }

  function _shortName(name) {
    return name.length > 18 ? name.slice(0, 15) + '…' : name;
  }

  function _esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Init
  refreshUI();
});
