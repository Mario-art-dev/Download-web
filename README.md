# Download Web

Web sencilla para pegar un enlace de YouTube o TikTok y descargar el vídeo en la mejor calidad disponible.

## Cómo funciona

- Frontend estático (`public/`) con un formulario para pegar la URL, previsualización (miniatura y título) y botón de descarga.
- Backend en Node.js/Express (`server/`) que usa [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) para extraer el vídeo en la mejor calidad (vídeo + audio se fusionan con `ffmpeg`) y lo envía al navegador como descarga directa.
- `ffmpeg` se incluye automáticamente vía el paquete `ffmpeg-static` (no hace falta instalarlo aparte).

## Requisitos

- Node.js 18+
- Python 3 y `yt-dlp` instalado en el sistema:

  ```bash
  pip install -U yt-dlp
  ```

## Instalación y arranque

```bash
npm install
npm start
```

Abre `http://localhost:3000` en el navegador.

## Notas sobre "descargar en la galería"

Por seguridad, ningún navegador permite que una web escriba directamente en la Galería/Fotos del dispositivo. Lo que hace esta web es forzar una descarga normal del archivo `.mp4`:

- **Android (Chrome):** el vídeo se guarda en la carpeta Descargas y, en la mayoría de dispositivos, el sistema lo indexa automáticamente en la app Galería/Fotos.
- **iPhone (Safari):** el vídeo se guarda en la app Archivos. Desde ahí puedes compartirlo y elegir "Guardar vídeo" para moverlo a Fotos.

## Variables de entorno

- `PORT`: puerto del servidor (por defecto `3000`).

## Aviso de uso

Descarga únicamente contenido para tu uso personal y respeta los derechos de autor y los términos de servicio de YouTube y TikTok.
