FROM node:20-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip ca-certificates git \
    && pip3 install --no-cache-dir --break-system-packages -U yt-dlp bgutil-ytdlp-pot-provider \
    && rm -rf /var/lib/apt/lists/*

# Proveedor de PO Token para yt-dlp: ayuda a que YouTube trate las peticiones
# desde IPs de datacenter (como las de Render) con menos sospecha, sin
# depender de cookies de una sesión real. Corre como servidor HTTP local en
# el puerto 4416; el plugin de Python lo detecta solo por defecto.
# https://github.com/Brainicism/bgutil-ytdlp-pot-provider
RUN git clone --single-branch --branch 1.3.1 --depth 1 \
    https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git /opt/bgutil-provider \
    && cd /opt/bgutil-provider/server \
    && npm ci \
    && npx tsc

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV NODE_ENV=production
EXPOSE 3000

CMD ["/app/start.sh"]
