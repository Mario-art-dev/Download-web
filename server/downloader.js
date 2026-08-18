'use strict';

const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

const URL_PATTERNS = [
  /^https?:\/\/(www\.|m\.)?youtube\.com\/watch\?.*v=/i,
  /^https?:\/\/(www\.)?youtube\.com\/shorts\//i,
  /^https?:\/\/youtu\.be\//i,
  /^https?:\/\/(www\.|vm\.|vt\.|m\.)?tiktok\.com\//i,
];

function isSupportedUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  } catch {
    return false;
  }
  return URL_PATTERNS.some((re) => re.test(url));
}

function checkYtDlpAvailable() {
  return new Promise((resolve) => {
    execFile('yt-dlp', ['--version'], (err) => resolve(!err));
  });
}

function sanitizeFilename(name) {
  return name
    .replace(/[\\/:*?"<>| -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'video';
}

// Muchos hostings en la nube (Render incluido) usan IPs de datacenter que
// YouTube trata con más sospecha que las IPs domésticas normales. Pedir la
// info como si fuera el cliente Android/iOS de YouTube suele evitar esos
// bloqueos con más frecuencia que el cliente "web" por defecto.
const YOUTUBE_EXTRACTOR_ARGS = ['--extractor-args', 'youtube:player_client=android,ios,web'];

// Cuando YouTube pide "Sign in to confirm you're not a bot" (frecuente en
// IPs de datacenter), la única solución fiable es que yt-dlp mande las
// cookies de una sesión real. Si existe un archivo cookies.txt (subido como
// Secret File en Render, nunca en el repo), se usa automáticamente.
const COOKIES_SOURCE = process.env.YTDLP_COOKIES_FILE || '/etc/secrets/cookies.txt';
// Render monta los Secret Files como solo-lectura, pero yt-dlp intenta
// reescribir el cookie jar tras cada uso. Se copia a una carpeta temporal
// (escribible) y se usa esa copia en su lugar.
const COOKIES_WRITABLE = path.join(os.tmpdir(), 'yt-dlp-cookies.txt');

function getCookiesArgs() {
  if (!fs.existsSync(COOKIES_SOURCE)) {
    console.warn('[cookies] no hay archivo en', COOKIES_SOURCE, '- se pedirá sin cookies');
    return [];
  }
  try {
    const size = fs.statSync(COOKIES_SOURCE).size;
    fs.copyFileSync(COOKIES_SOURCE, COOKIES_WRITABLE);
    console.log('[cookies] usando', COOKIES_SOURCE, `(${size} bytes)`);
  } catch (err) {
    console.error('[cookies] no se pudo copiar el archivo de cookies:', err.message);
    return [];
  }
  return ['--cookies', COOKIES_WRITABLE];
}

function getInfo(url) {
  return new Promise((resolve, reject) => {
    execFile(
      'yt-dlp',
      ['-J', '--no-playlist', '--no-warnings', ...YOUTUBE_EXTRACTOR_ARGS, ...getCookiesArgs(), url],
      { maxBuffer: 1024 * 1024 * 20, timeout: 60000 },
      (err, stdout, stderr) => {
        if (err) {
          const reason = (stderr || '').trim().split('\n').filter(Boolean).pop();
          return reject(new Error(reason || 'No se pudo obtener información del vídeo'));
        }
        try {
          const data = JSON.parse(stdout);
          resolve({
            title: data.title || 'video',
            thumbnail: data.thumbnail || null,
            duration: data.duration || null,
            uploader: data.uploader || null,
          });
        } catch {
          reject(new Error('Respuesta inesperada al analizar el vídeo'));
        }
      }
    );
  });
}

async function downloadVideo(url, { onProgress } = {}) {
  const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'dlweb-'));
  const outputTemplate = path.join(workDir, '%(id)s.%(ext)s');

  const args = [
    '--no-playlist',
    '--no-warnings',
    '--newline',
    '-f', 'bv*+ba/b',
    '--merge-output-format', 'mp4',
    '--ffmpeg-location', ffmpegPath,
    // Sin límite de duración: los vídeos largos simplemente tardan más.
    // Estos flags dan más margen de reintentos para que una descarga
    // larga no se caiga por un corte de red puntual.
    '--retries', '20',
    '--fragment-retries', '20',
    '--socket-timeout', '30',
    ...YOUTUBE_EXTRACTOR_ARGS,
    ...getCookiesArgs(),
    '-o', outputTemplate,
    '--print', 'after_move:filepath',
    url,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', args);
    let stderr = '';
    let printedPath = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      printedPath += text;
      if (onProgress) {
        const match = text.match(/\[download\]\s+([\d.]+)%/);
        if (match) onProgress(parseFloat(match[1]));
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      cleanup(workDir);
      reject(err);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        cleanup(workDir);
        reject(new Error(stderr.trim().split('\n').pop() || 'Fallo al descargar el vídeo'));
        return;
      }
      const lines = printedPath.trim().split('\n').filter(Boolean);
      const filePath = lines[lines.length - 1];
      if (!filePath || !fs.existsSync(filePath)) {
        cleanup(workDir);
        reject(new Error('No se encontró el archivo descargado'));
        return;
      }
      resolve({ filePath, workDir });
    });
  });
}

function cleanup(workDir) {
  fs.rm(workDir, { recursive: true, force: true }, () => {});
}

module.exports = {
  isSupportedUrl,
  checkYtDlpAvailable,
  sanitizeFilename,
  getInfo,
  downloadVideo,
  cleanup,
};
