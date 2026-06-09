FROM node:22-alpine

WORKDIR /app/server

# Contratos compartilhados (dependência local do package.json)
COPY app/packages/contracts /app/app/packages/contracts

COPY server/package.json server/package-lock.json ./
RUN npm ci

COPY server/tsconfig.json ./
COPY server/src ./src

EXPOSE 3000

CMD ["npm", "run", "dev"]
