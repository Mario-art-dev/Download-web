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

## Desplegarlo gratis en Render

El repo ya incluye un `Dockerfile` y un `render.yaml` con todo configurado (Node, Python y `yt-dlp` instalados, sin que tengas que tocar nada). Solo tienes que:

1. Entra en [render.com](https://render.com) y crea una cuenta gratuita (puedes usar "Sign up with GitHub", no hace falta tarjeta).
2. Click en **New +** → **Blueprint**.
3. Conecta tu cuenta de GitHub y selecciona el repositorio `Mario-art-dev/Download-web`.
4. Render detecta el `render.yaml` automáticamente y propone un servicio llamado `download-web` en el plan **Free**. Dale a **Apply/Deploy**.
5. Espera unos minutos a que construya la imagen. Cuando termine, te da una URL pública tipo `https://download-web-xxxx.onrender.com` — esa es la web, ábrela desde el móvil y ya puedes pegar enlaces.

**Ten en cuenta el plan gratuito de Render (no es "sin límites" real, ningún hosting gratuito lo es):**

- El servicio se "duerme" tras 15 minutos sin uso, y la primera petición después de dormir tarda entre 30-60 segundos en despertar (luego va normal).
- Incluye 750 horas/mes gratis, más que de sobra para uso personal.
- El disco es temporal (se borra en cada redeploy), pero no pasa nada: los vídeos se descargan, se sirven y se borran del servidor en la misma petición, no se guardan ahí.

Si con el uso lo notas lento o quieres que no se duerma nunca, el siguiente paso sería pasar al plan de pago de Render (~7 $/mes) o a un VPS propio.

## YouTube pide "Sign in to confirm you're not a bot"

YouTube bloquea con más frecuencia las IPs de servidores en la nube (Render incluida) y pide verificar que no eres un bot.

**Primera línea de defensa (automática, no requiere hacer nada):** la imagen incluye un [proveedor de PO Token](https://github.com/Brainicism/bgutil-ytdlp-pot-provider) que corre junto a la app y ayuda a que las peticiones parezcan más legítimas sin necesitar cookies. No está garantizado al 100% (YouTube cambia esto constantemente), pero es la mejora que menos esfuerzo requiere.

**Si aun así sigue fallando, la solución fiable es usar las cookies de tu propia sesión de YouTube.** **Nunca subas ese archivo al repositorio** (son credenciales de tu cuenta); en Render se sube como "Secret File", que no se guarda en git y solo lo ve tu servicio.

1. En tu **ordenador**, con Chrome o Firefox, inicia sesión en [youtube.com](https://youtube.com) con tu cuenta normal.
2. Instala la extensión **"Get cookies.txt LOCALLY"** ([Chrome Web Store](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)) y, estando en youtube.com, expórtalas: te descarga un archivo `cookies.txt`. En Android, **Kiwi Browser** soporta la misma extensión. En iPhone no hay una forma fiable de hacerlo (Safari no da acceso a las cookies de sesión aunque se usen apps de terceros).
3. En el dashboard de Render, entra en tu servicio `download-web` → pestaña **Environment** → sección **Secret Files**.
4. **Add Secret File**: en "Filename" pon solo **`cookies.txt`** (sin ruta, Render ya lo coloca en `/etc/secrets/`) y pega dentro el contenido completo del `cookies.txt` que descargaste.
5. Guarda. Render redesplegará solo el servicio con el archivo disponible; el código ya lo detecta automáticamente si existe en esa ruta (se puede cambiar con la variable `YTDLP_COOKIES_FILE` si prefieres otra ruta).
6. Prueba de nuevo el mismo enlace en la web.

Las cookies de YouTube caducan cada cierto tiempo (semanas/meses); si el error vuelve a aparecer, repite los pasos 1-2 y actualiza el Secret File en Render con el `cookies.txt` nuevo.

## Variables de entorno

- `PORT`: puerto del servidor (por defecto `3000`).
- `YTDLP_COOKIES_FILE`: ruta a un `cookies.txt` de YouTube (opcional). Por defecto `/etc/secrets/cookies.txt`, que es donde Render pone los Secret Files.

## Aviso de uso

Descarga únicamente contenido para tu uso personal y respeta los derechos de autor y los términos de servicio de YouTube y TikTok.
