/* ============================================================
   merge.js — Merge page logic
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

  // ── State ────────────────────────────────────────────────
  const files = []; // [{ fileId, filename, originalName, pageCount, fileSize }]
  let sortableInstance = null;

  // ── DOM refs ─────────────────────────────────────────────
  const uploadZone      = document.getElementById('mergeUploadZone');
  const fileInput       = document.getElementById('mergeFileInput');
  const addMoreInput    = document.getElementById('mergeAddMoreInput');
  const filesSection    = document.getElementById('mergeFilesSection');
  const emptyState      = document.getElementById('mergeEmptyState');
  const fileList        = document.getElementById('mergeFileList');
  const fileCountBadge  = document.getElementById('mergeFileCount');
  const addMoreBtn      = document.getElementById('mergeAddMore');
  const mergeBtn        = document.getElementById('mergeMergeBtn');
  const clearBtn        = document.getElementById('mergeClearBtn');
  const outputFilename  = document.getElementById('outputFilename');
  const progressWrap    = document.getElementById('mergeProgress');
  const progressBar     = document.getElementById('mergeProgressBar');
  const progressLabel   = document.getElementById('mergeProgressLabel');

  if (!uploadZone) return;

  // ── Upload zone ──────────────────────────────────────────
  UploadZone.init('mergeUploadZone', 'mergeFileInput', {
    multiple: true,
    onFiles: handleFileSelection,
  });

  // "Add more" button
  addMoreBtn && addMoreBtn.addEventListener('click', function () {
    addMoreInput.click();
  });

  addMoreInput && addMoreInput.addEventListener('change', function () {
    if (addMoreInput.files && addMoreInput.files.length) {
      handleFileSelection(Array.from(addMoreInput.files));
      addMoreInput.value = '';
    }
  });

  // ── Handle new file selections ───────────────────────────
  async function handleFileSelection(selectedFiles) {
    const newFiles = Array.from(selectedFiles);
    if (!newFiles.length) return;

    // Show files section if first upload
    updateUI();

    for (const file of newFiles) {
      const tempId = 'temp-' + Date.now() + '-' + Math.random();
      const card = createFileCard({
        fileId: tempId,
        originalName: file.name,
        filename: file.name,
        pageCount: null,
        fileSize: file.size,
        uploading: true,
      });
      fileList_add({ fileId: tempId, card });
      fileList.appendChild(card);

      try {
        const data = await UploadZone.uploadFile(file, function (pct) {
          const bar = card.querySelector('.file-upload-bar');
          if (bar) bar.style.width = pct + '%';
        });

        // Replace temp entry with real data
        const existing = files.findIndex(f => f.fileId === tempId);
        if (existing >= 0) {
          files[existing] = {
            fileId: data.file_id,
            filename: data.filename,
            originalName: data.original_name,
            pageCount: data.page_count,
            fileSize: data.file_size,
          };
          updateCardData(card, files[existing]);
        }
      } catch (err) {
        Toast.error('Upload failed', err.message);
        removeFileCard(tempId);
      }

      updateUI();
    }
  }

  function fileList_add(entry) {
    files.push(entry);
  }

  // ── Create a file card DOM element ───────────────────────
  function createFileCard(data) {
    const li = document.createElement('li');
    li.className = 'file-card fade-in-up';
    li.dataset.fileId = data.fileId;
    li.setAttribute('role', 'listitem');

    li.innerHTML = `
      <span class="file-card-grip" aria-hidden="true" title="Drag to reorder">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="5"  r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="9" cy="19" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="15" cy="5"  r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="15" cy="19" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
      </span>
      <span class="file-card-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      </span>
      <div class="file-card-info">
        <p class="file-card-name" title="${_esc(data.originalName)}">${_esc(data.originalName)}</p>
        <p class="file-card-meta file-card-meta-text">
          ${data.uploading ? 'Uploading...' : _fileMeta(data)}
        </p>
        ${data.uploading ? `<div class="progress-wrap" style="height:3px;margin-top:6px"><div class="progress-bar file-upload-bar" style="width:0%"></div></div>` : ''}
      </div>
      <button class="file-card-remove" aria-label="Remove ${_esc(data.originalName)}" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
        </svg>
      </button>`;

    li.querySelector('.file-card-remove').addEventListener('click', function () {
      removeFileCard(li.dataset.fileId);
    });

    return li;
  }

  function updateCardData(card, data) {
    card.dataset.fileId = data.fileId;
    const metaEl = card.querySelector('.file-card-meta-text');
    if (metaEl) metaEl.textContent = _fileMeta(data);
    const removeBtn = card.querySelector('.file-card-remove');
    if (removeBtn) {
      removeBtn.setAttribute('aria-label', `Remove ${data.originalName}`);
    }
    const progressRow = card.querySelector('.progress-wrap');
    if (progressRow) progressRow.remove();
  }

  function removeFileCard(fileId) {
    const idx = files.findIndex(f => f.fileId === fileId);
    if (idx >= 0) {
      // Try to delete from server (ignore errors)
      if (!fileId.startsWith('temp-')) {
        fetch('/api/files/' + fileId, { method: 'DELETE' }).catch(() => {});
      }
      files.splice(idx, 1);
    }
    const card = fileList.querySelector(`li[data-file-id="${fileId}"]`);
    if (card) {
      card.style.transition = 'opacity 0.2s, transform 0.2s';
      card.style.opacity = '0';
      card.style.transform = 'translateX(-8px)';
      setTimeout(() => card.remove(), 220);
    }
    updateUI();
  }

  // ── SortableJS drag-and-drop ──────────────────────────────
  function initSortable() {
    if (sortableInstance) return;
    if (typeof Sortable === 'undefined') return;

    sortableInstance = Sortable.create(fileList, {
      handle: '.file-card-grip',
      animation: 200,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
    });
  }

  // ── Update UI state ──────────────────────────────────────
  function updateUI() {
    const count = files.length;
    fileCountBadge.textContent = count;

    if (count > 0) {
      filesSection.classList.remove('hidden');
      emptyState.classList.add('hidden');
      mergeBtn.disabled = count < 2;
      if (count >= 2) initSortable();
    } else {
      filesSection.classList.add('hidden');
      emptyState.classList.remove('hidden');
    }
  }

  // ── Clear all ─────────────────────────────────────────────
  clearBtn && clearBtn.addEventListener('click', function () {
    files.forEach(f => {
      if (!f.fileId.startsWith('temp-')) {
        fetch('/api/files/' + f.fileId, { method: 'DELETE' }).catch(() => {});
      }
    });
    files.length = 0;
    fileList.innerHTML = '';
    updateUI();
  });

  // ── Merge & Download ──────────────────────────────────────
  mergeBtn && mergeBtn.addEventListener('click', async function () {
    const readyFiles = files.filter(f => !f.fileId.startsWith('temp-'));
    if (readyFiles.length < 2) {
      Toast.warning('Not enough files', 'Please upload at least 2 PDF files to merge.');
      return;
    }

    // Get order from DOM
    const orderedIds = Array.from(fileList.querySelectorAll('li[data-file-id]'))
      .map(el => el.dataset.fileId)
      .filter(id => !id.startsWith('temp-'));

    const outputName = (outputFilename.value || 'merged-document').trim();

    // Show progress
    progressWrap.classList.remove('hidden');
    mergeBtn.disabled = true;
    mergeBtn.innerHTML = `<span class="spinner"></span> Merging...`;
    Utils.setProgress(progressBar, progressLabel, 30, 'Merging files...');

    try {
      const resp = await fetch('/api/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_ids: orderedIds, output_name: outputName }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Merge failed');
      }

      Utils.setProgress(progressBar, progressLabel, 100, 'Done! Starting download...');

      Toast.success('Merge complete!', `${data.page_count} pages merged successfully.`);

      setTimeout(function () {
        Utils.triggerDownload(data.result_id, data.filename);
        progressWrap.classList.add('hidden');
        Utils.setProgress(progressBar, null, 0);
      }, 600);

    } catch (err) {
      Toast.error('Merge failed', err.message);
      progressWrap.classList.add('hidden');
    } finally {
      mergeBtn.disabled = false;
      mergeBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
        </svg>
        Merge &amp; Download`;
    }
  });

  // ── Helpers ───────────────────────────────────────────────
  function _fileMeta(data) {
    const parts = [];
    if (data.pageCount != null) parts.push(data.pageCount + (data.pageCount === 1 ? ' page' : ' pages'));
    if (data.fileSize != null) parts.push(Utils.formatBytes(data.fileSize));
    return parts.join(' · ');
  }

  function _esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Init
  updateUI();
});
