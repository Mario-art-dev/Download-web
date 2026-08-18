(() => {
  const form = document.getElementById('form');
  const urlInput = document.getElementById('url');
  const pasteBtn = document.getElementById('pasteBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const statusEl = document.getElementById('status');
  const preview = document.getElementById('preview');
  const thumb = document.getElementById('thumb');
  const titleEl = document.getElementById('title');
  const metaEl = document.getElementById('meta');

  let previewTimer = null;

  function setStatus(message, type) {
    if (!message) {
      statusEl.classList.add('hidden');
      statusEl.textContent = '';
      return;
    }
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
  }

  function formatDuration(seconds) {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  }

  async function fetchPreview(url) {
    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      thumb.src = data.thumbnail || '';
      titleEl.textContent = data.title || '';
      const parts = [];
      if (data.uploader) parts.push(data.uploader);
      if (data.duration) parts.push(formatDuration(data.duration));
      metaEl.textContent = parts.join(' · ');
      preview.classList.remove('hidden');
    } catch {
      preview.classList.add('hidden');
    }
  }

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text.trim();
        urlInput.dispatchEvent(new Event('input'));
      }
    } catch {
      setStatus('No se pudo acceder al portapapeles. Pégalo manualmente.', 'error');
    }
  });

  urlInput.addEventListener('input', () => {
    clearTimeout(previewTimer);
    const url = urlInput.value.trim();
    setStatus('', null);
    if (!url) {
      preview.classList.add('hidden');
      return;
    }
    previewTimer = setTimeout(() => fetchPreview(url), 500);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    downloadBtn.disabled = true;
    setStatus('Preparando descarga en la mejor calidad disponible… puede tardar unos segundos.', 'info');

    const downloadUrl = `/api/download?url=${encodeURIComponent(url)}`;

    fetch(downloadUrl)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'No se pudo descargar el vídeo.');
        }
        const disposition = res.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="(.+)"/);
        const filename = match ? match[1] : 'video.mp4';
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
        setStatus('¡Descarga completada!', 'success');
      })
      .catch((err) => {
        setStatus(err.message || 'Ocurrió un error al descargar el vídeo.', 'error');
      })
      .finally(() => {
        downloadBtn.disabled = false;
      });
  });
})();
