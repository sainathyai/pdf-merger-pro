/* ============================================================
   reorder.js — Reorder/rotate page logic
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

  // ── State ────────────────────────────────────────────────
  let fileId      = null;
  let pages       = [];  // [{ origIdx, currentRotation }] in display order
  let selected    = new Set();  // indices into `pages` array
  let sortable    = null;
  let originalOrder = [];

  // ── DOM refs ─────────────────────────────────────────────
  const uploadSection   = document.getElementById('reorderUploadSection');
  const workspace       = document.getElementById('reorderWorkspace');
  const fileName        = document.getElementById('reorderFileName');
  const fileMeta        = document.getElementById('reorderFileMeta');
  const changeFileBtn   = document.getElementById('reorderChangeFile');
  const thumbnailGrid   = document.getElementById('reorderThumbnailGrid');
  const pageCountBadge  = document.getElementById('reorderPageCount');
  const selCountLabel   = document.getElementById('reorderSelCount');
  const selectAllBtn    = document.getElementById('reorderSelectAll');
  const deselectAllBtn  = document.getElementById('reorderDeselectAll');
  const rotateSelBtn    = document.getElementById('reorderRotateSelected');
  const deleteSelBtn    = document.getElementById('reorderDeleteSelected');
  const saveBtn         = document.getElementById('reorderSaveBtn');
  const resetBtn        = document.getElementById('reorderResetBtn');
  const progressWrap    = document.getElementById('reorderProgress');
  const progressBar     = document.getElementById('reorderProgressBar');
  const progressLabel   = document.getElementById('reorderProgressLabel');

  if (!document.getElementById('reorderUploadZone')) return;

  // ── Upload ────────────────────────────────────────────────
  UploadZone.init('reorderUploadZone', 'reorderFileInput', {
    multiple: false,
    onFiles: function (files) { handleUpload(files[0]); },
  });

  async function handleUpload(file) {
    fileId = null;
    pages  = [];
    selected.clear();
    thumbnailGrid.innerHTML = '';

    // Show skeletons
    for (let i = 0; i < 6; i++) {
      const sk = document.createElement('div');
      sk.className = 'thumbnail-card';
      sk.innerHTML = `<div class="thumbnail-skeleton"></div><div class="thumbnail-footer"><span class="thumbnail-label">Page ${i+1}</span></div>`;
      thumbnailGrid.appendChild(sk);
    }

    try {
      const data = await UploadZone.uploadFile(file, function () {});

      fileId = data.file_id;
      fileName.textContent = data.original_name;
      fileMeta.textContent = `${data.page_count} pages · ${Utils.formatBytes(data.file_size)}`;

      // Build pages state
      for (let i = 0; i < data.page_count; i++) {
        pages.push({ origIdx: i, rotation: 0, thumbData: data.thumbnails[i] || null });
      }
      originalOrder = pages.map(p => p.origIdx);

      uploadSection.classList.add('hidden');
      workspace.classList.remove('hidden');

      renderThumbnails();
      initSortable();
      updateUI();

    } catch (err) {
      uploadSection.classList.remove('hidden');
      workspace.classList.add('hidden');
      thumbnailGrid.innerHTML = '';
      Toast.error('Upload failed', err.message);
    }
  }

  // ── Render thumbnails ─────────────────────────────────────
  function renderThumbnails() {
    thumbnailGrid.innerHTML = '';
    pages.forEach(function (page, displayIdx) {
      thumbnailGrid.appendChild(buildThumbCard(page, displayIdx));
    });
  }

  function buildThumbCard(page, displayIdx) {
    const card = document.createElement('div');
    card.className = 'thumbnail-card';
    card.dataset.displayIdx = displayIdx;
    card.dataset.origIdx    = page.origIdx;
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Page ${displayIdx + 1} (original page ${page.origIdx + 1}), click to select`);

    const imgSrc = page.thumbData ? `data:image/jpeg;base64,${page.thumbData}` : '';

    card.innerHTML = `
      <div class="thumbnail-img-wrapper">
        ${imgSrc
          ? `<img src="${imgSrc}" alt="Page ${displayIdx + 1} preview" loading="lazy"
                 style="transform: rotate(${page.rotation}deg)">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-surface-2);color:var(--text-secondary);font-size:0.8rem">Page ${displayIdx + 1}</div>`}
        <span class="thumbnail-check" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
      </div>
      <div class="thumbnail-footer">
        <span class="thumbnail-label">Page ${displayIdx + 1}</span>
        <div class="thumbnail-actions">
          <button class="thumbnail-action-btn rotate-btn" title="Rotate 90°" aria-label="Rotate page ${displayIdx + 1} 90 degrees clockwise" type="button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
          <button class="thumbnail-action-btn delete delete-btn" title="Delete page" aria-label="Delete page ${displayIdx + 1}" type="button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      </div>`;

    card.addEventListener('click', function (e) {
      if (e.target.closest('.rotate-btn') || e.target.closest('.delete-btn')) return;
      toggleSelect(displayIdx, card);
    });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSelect(displayIdx, card);
      }
    });

    card.querySelector('.rotate-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      rotatePage(displayIdx);
    });

    card.querySelector('.delete-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      deletePage(displayIdx);
    });

    if (selected.has(displayIdx)) {
      card.classList.add('selected');
    }

    return card;
  }

  // ── Selection ─────────────────────────────────────────────
  function toggleSelect(idx, card) {
    if (selected.has(idx)) {
      selected.delete(idx);
      card.classList.remove('selected');
    } else {
      selected.add(idx);
      card.classList.add('selected');
    }
    updateUI();
  }

  selectAllBtn && selectAllBtn.addEventListener('click', function () {
    selected.clear();
    pages.forEach((_, i) => selected.add(i));
    thumbnailGrid.querySelectorAll('.thumbnail-card').forEach(c => c.classList.add('selected'));
    updateUI();
  });

  deselectAllBtn && deselectAllBtn.addEventListener('click', function () {
    selected.clear();
    thumbnailGrid.querySelectorAll('.thumbnail-card').forEach(c => c.classList.remove('selected'));
    updateUI();
  });

  // ── Rotate ────────────────────────────────────────────────
  function rotatePage(displayIdx) {
    pages[displayIdx].rotation = (pages[displayIdx].rotation + 90) % 360;
    const card = thumbnailGrid.querySelector(`[data-display-idx="${displayIdx}"]`);
    if (card) {
      const img = card.querySelector('img');
      if (img) img.style.transform = `rotate(${pages[displayIdx].rotation}deg)`;
    }
  }

  rotateSelBtn && rotateSelBtn.addEventListener('click', function () {
    selected.forEach(idx => rotatePage(idx));
  });

  // ── Delete ────────────────────────────────────────────────
  function deletePage(displayIdx) {
    if (pages.length <= 1) {
      Toast.warning('Cannot delete', 'The document must have at least one page.');
      return;
    }
    pages.splice(displayIdx, 1);
    // Rebuild selected set (shift indices > deleted down)
    const newSelected = new Set();
    selected.forEach(i => {
      if (i < displayIdx) newSelected.add(i);
      else if (i > displayIdx) newSelected.add(i - 1);
    });
    selected = newSelected;
    renderThumbnails();
    initSortable();
    updateUI();
  }

  deleteSelBtn && deleteSelBtn.addEventListener('click', function () {
    if (selected.size === 0) return;
    if (pages.length - selected.size < 1) {
      Toast.warning('Cannot delete', 'The document must have at least one page.');
      return;
    }
    // Delete in reverse order to preserve indices
    const toDelete = Array.from(selected).sort((a, b) => b - a);
    toDelete.forEach(idx => pages.splice(idx, 1));
    selected.clear();
    renderThumbnails();
    initSortable();
    updateUI();
  });

  // ── SortableJS ────────────────────────────────────────────
  function initSortable() {
    if (sortable) { sortable.destroy(); sortable = null; }
    if (typeof Sortable === 'undefined') return;

    sortable = Sortable.create(thumbnailGrid, {
      animation: 200,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: function (evt) {
        const moved = pages.splice(evt.oldIndex, 1)[0];
        pages.splice(evt.newIndex, 0, moved);
        // Re-render to keep data-display-idx in sync
        renderThumbnails();
        initSortable();
        // Re-apply selections (lost after re-render — keep 0 selected after drag)
        selected.clear();
        updateUI();
      },
    });
  }

  // ── Reset ────────────────────────────────────────────────
  resetBtn && resetBtn.addEventListener('click', function () {
    if (!fileId) return;
    pages = originalOrder.map(origIdx => ({ origIdx, rotation: 0, thumbData: pages.find(p=>p.origIdx===origIdx)?.thumbData || null }));
    selected.clear();
    renderThumbnails();
    initSortable();
    updateUI();
    Toast.info('Order reset', 'Pages restored to original order.');
  });

  // ── Change file ───────────────────────────────────────────
  changeFileBtn && changeFileBtn.addEventListener('click', function () {
    if (fileId) fetch('/api/files/' + fileId, { method: 'DELETE' }).catch(() => {});
    fileId = null; pages = []; selected.clear();
    workspace.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    thumbnailGrid.innerHTML = '';
  });

  // ── Save & Download ───────────────────────────────────────
  saveBtn && saveBtn.addEventListener('click', async function () {
    if (!fileId || pages.length === 0) return;

    const pageOrder = pages.map(p => p.origIdx);
    const rotations = {};
    pages.forEach(p => {
      if (p.rotation !== 0) rotations[String(p.origIdx)] = p.rotation;
    });

    progressWrap.classList.remove('hidden');
    saveBtn.disabled = true;
    Utils.setProgress(progressBar, progressLabel, 40, 'Saving changes...');

    try {
      const resp = await fetch('/api/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId, page_order: pageOrder, rotations }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Reorder failed');

      Utils.setProgress(progressBar, progressLabel, 100, 'Done! Starting download...');
      Toast.success('Saved!', `${data.page_count} pages saved successfully.`);

      setTimeout(function () {
        Utils.triggerDownload(data.result_id, data.filename);
        progressWrap.classList.add('hidden');
        Utils.setProgress(progressBar, null, 0);
      }, 600);

    } catch (err) {
      Toast.error('Save failed', err.message);
      progressWrap.classList.add('hidden');
    } finally {
      saveBtn.disabled = false;
    }
  });

  // ── updateUI ─────────────────────────────────────────────
  function updateUI() {
    if (pageCountBadge) pageCountBadge.textContent = pages.length + ' pages';
    if (selCountLabel)  selCountLabel.textContent  = selected.size;
    if (saveBtn) saveBtn.disabled = pages.length === 0;
    if (rotateSelBtn) rotateSelBtn.disabled = selected.size === 0;
    if (deleteSelBtn) deleteSelBtn.disabled = selected.size === 0;
  }
});
