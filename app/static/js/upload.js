/* ============================================================
   upload.js — Shared drag-and-drop upload zone logic
   ============================================================ */

'use strict';

window.UploadZone = (function () {

  /**
   * Initialise a drag-and-drop upload zone.
   *
   * @param {string} zoneId        — ID of the upload zone element
   * @param {string} inputId       — ID of the <input type="file"> inside the zone
   * @param {object} opts
   *   multiple  {boolean}         — allow multiple files (default false)
   *   onFiles   {function}        — called with FileList when valid files are dropped/selected
   *   maxSizeMB {number}          — max size per file in MB (default 100)
   */
  function init(zoneId, inputId, opts) {
    const zone  = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    if (!zone || !input) return;

    opts = Object.assign({ multiple: false, onFiles: null, maxSizeMB: 100 }, opts);

    // Make zone keyboard-accessible
    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });

    // Click on zone opens file picker (the hidden input is already positioned over the zone)
    // We prevent double-triggering by stopping propagation from the input
    input.addEventListener('click', function (e) { e.stopPropagation(); });

    // File input change
    input.addEventListener('change', function () {
      if (input.files && input.files.length) {
        handleFiles(input.files, zone, opts);
        input.value = ''; // reset so same file can be re-selected
      }
    });

    // Drag events on window (to prevent browser default of opening file)
    window.addEventListener('dragover',  function (e) { e.preventDefault(); });
    window.addEventListener('drop',      function (e) { e.preventDefault(); });

    // Drag events on the zone
    zone.addEventListener('dragenter', function (e) {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', function (e) {
      // Only remove if leaving the zone entirely
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('drag-over');
      }
    });

    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files, zone, opts);
      }
    });
  }

  function handleFiles(fileList, zone, opts) {
    const MAX_BYTES = (opts.maxSizeMB || 100) * 1024 * 1024;
    const validFiles = [];
    const errors = [];

    Array.from(fileList).forEach(function (file) {
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        errors.push(`"${file.name}" is not a PDF file.`);
        return;
      }
      if (file.size > MAX_BYTES) {
        errors.push(`"${file.name}" exceeds the ${opts.maxSizeMB} MB limit.`);
        return;
      }
      if (!opts.multiple && validFiles.length >= 1) return; // single-file mode
      validFiles.push(file);
    });

    if (errors.length) {
      zone.classList.add('upload-error');
      setTimeout(() => zone.classList.remove('upload-error'), 600);
      errors.forEach(function (msg) {
        window.Toast && Toast.error('Upload error', msg);
      });
    }

    if (validFiles.length && typeof opts.onFiles === 'function') {
      opts.onFiles(validFiles);
    }
  }

  /**
   * Upload a single File to /api/upload.
   * Returns a Promise resolving to the JSON response.
   */
  function uploadFile(file, onProgress) {
    return new Promise(function (resolve, reject) {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.upload.addEventListener('progress', function (e) {
        if (e.lengthComputable && typeof onProgress === 'function') {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', function () {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new Error(data.error || 'Upload failed'));
          }
        } catch (e) {
          reject(new Error('Invalid server response'));
        }
      });

      xhr.addEventListener('error', function () {
        reject(new Error('Network error during upload'));
      });

      xhr.send(formData);
    });
  }

  return { init, uploadFile };
})();
