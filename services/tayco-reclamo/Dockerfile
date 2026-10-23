FROM node:22-slim
WORKDIR /app
COPY package.json server.js ./
ENV NODE_ENV=production DATA_DIR=/data PORT=3000
# El volumen de Railway se monta en /data (estado, PDF y bitácora). Un solo réplica.
EXPOSE 3000
CMD ["node", "server.js"]
