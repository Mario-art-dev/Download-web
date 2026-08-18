'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const {
  isSupportedUrl,
  checkYtDlpAvailable,
  sanitizeFilename,
  getInfo,
  downloadVideo,
  cleanup,
} = require('./downloader');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', async (req, res) => {
  const ytDlpOk = await checkYtDlpAvailable();
  res.json({ ok: true, ytDlp: ytDlpOk });
});

app.get('/api/info', async (req, res) => {
  const { url } = req.query;
  if (!url || !isSupportedUrl(url)) {
    return res.status(400).json({ error: 'URL no soportada. Usa un enlace de YouTube o TikTok.' });
  }
  try {
    const info = await getInfo(url);
    res.json(info);
  } catch (err) {
    res.status(502).json({ error: err.message || 'No se pudo obtener información del vídeo' });
  }
});

app.get('/api/download', async (req, res) => {
  const { url } = req.query;
  if (!url || !isSupportedUrl(url)) {
    return res.status(400).json({ error: 'URL no soportada. Usa un enlace de YouTube o TikTok.' });
  }

  let workDir;
  try {
    let title = 'video';
    try {
      const info = await getInfo(url);
      title = sanitizeFilename(info.title);
    } catch {
      // seguimos con el nombre por defecto si falla la metadata
    }

    const result = await downloadVideo(url);
    workDir = result.workDir;
    const { filePath } = result;

    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('close', () => cleanup(workDir));
    stream.on('error', () => {
      cleanup(workDir);
      if (!res.headersSent) res.status(500).end();
    });
  } catch (err) {
    if (workDir) cleanup(workDir);
    if (!res.headersSent) {
      res.status(502).json({ error: err.message || 'Fallo al descargar el vídeo' });
    }
  }
});

const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  checkYtDlpAvailable().then((ok) => {
    if (!ok) {
      console.warn('AVISO: no se encontró "yt-dlp" en el sistema. Instálalo con: pip install -U yt-dlp');
    }
  });
});

// Sin límite de tiempo para las peticiones/conexiones: un vídeo largo
// (1 hora o más) puede tardar varios minutos en descargarse y fusionarse
// antes de empezar a enviarse, y no queremos que Node corte la conexión.
server.timeout = 0;
server.requestTimeout = 0;
server.keepAliveTimeout = 0;
