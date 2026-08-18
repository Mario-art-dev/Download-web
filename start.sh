#!/bin/sh
set -e

# Arranca el proveedor de PO Token en segundo plano (puerto 4416, solo
# accesible dentro del propio contenedor). Si falla al arrancar, la app
# principal sigue funcionando igual, simplemente sin ese token de más.
node /opt/bgutil-provider/server/build/main.js --port 4416 &

exec node server/index.js
