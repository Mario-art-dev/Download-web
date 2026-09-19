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

  // La descarga no tiene límite de duración: un vídeo de 10 minutos o de 1
  // hora se descarga igual, solo que tarda más. Para que un vídeo largo (que
  // puede pesar varios cientos de MB o unos GB) no sature la memoria del
  // navegador ni se corte si se bloquea la pantalla en el móvil, se dispara
  // como una descarga nativa del navegador en vez de cargarla entera en JS.
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    downloadBtn.disabled = true;
    setStatus('Comprobando el enlace…', 'info');

    try {
      const infoRes = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
      const info = await infoRes.json().catch(() => ({}));
      if (!infoRes.ok) {
        throw new Error(info.error || 'No se pudo comprobar el vídeo.');
      }

      const isLong = info.duration && info.duration > 180;
      const waitMsg = isLong
        ? `Vídeo de ${formatDuration(info.duration)}: la descarga puede tardar varios minutos, no hay límite de duración. No cierres esta pestaña.`
        : 'Descargando en la mejor calidad disponible…';
      setStatus(waitMsg, 'info');

      const downloadUrl = `/api/download?url=${encodeURIComponent(url)}`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => {
        setStatus(
          'La descarga se ha iniciado en tu navegador. Para vídeos largos puede tardar varios minutos: revisa la barra/gestor de descargas para ver el progreso y saber cuándo termina.',
          'success'
        );
        downloadBtn.disabled = false;
      }, 1500);
    } catch (err) {
      setStatus(err.message || 'Ocurrió un error al descargar el vídeo.', 'error');
      downloadBtn.disabled = false;
    }
  });
})();
