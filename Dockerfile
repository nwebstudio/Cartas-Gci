# Imagen base de Node con Debian (para poder instalar LibreOffice con apt)
FROM node:20-bookworm-slim

# Instala LibreOffice (solo el módulo de texto, para mantener la imagen liviana)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libreoffice-writer && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia primero package.json para aprovechar el caché de Docker en despliegues futuros
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copia el resto del proyecto (backend, frontend, templates)
COPY . .

WORKDIR /app/backend

# Render asigna el puerto dinámicamente vía la variable de entorno PORT
EXPOSE 3000

CMD ["node", "server.js"]
