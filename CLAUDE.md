# Instrucciones del proyecto

## Librerías de animación / UI preferidas

En cualquier trabajo de frontend (animaciones, scroll, efectos, componentes visuales), usar y priorizar estas librerías:

- **GSAP** — https://github.com/greensock/GSAP
  Motor principal de animaciones (timelines, ScrollTrigger, SplitText, etc.).
  CDN: `https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js` (+ plugins en `/dist/`). npm: `gsap`.
- **Lenis** — https://github.com/darkroomengineering/lenis
  Smooth scroll. Integrarlo con GSAP ScrollTrigger:
  ```js
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  ```
  CDN: `https://unpkg.com/lenis@1/dist/lenis.min.js` (+ `lenis.css`). npm: `lenis`.
- **React Bits** — https://github.com/DavidHDev/react-bits
  Colección de componentes animados (texto, fondos, efectos). Son componentes React
  que se copian al proyecto (o vía `npx shadcn` / `jsrepo`). Usarlos cuando el frontend
  sea React; en el frontend actual (HTML/JS vanilla en `public/`) tomarlos como
  referencia y recrear el efecto con GSAP.

Respetar `prefers-reduced-motion` (desactivar Lenis y reducir animaciones).

## Estructura

- `server/` — backend Express (descarga con yt-dlp + ffmpeg).
- `public/` — frontend estático (`index.html`, `app.js`, `styles.css`).
