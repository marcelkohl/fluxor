# Fluxor Server

API HTTP do Fluxor — produto independente do cliente desktop/web em `app/`.

Nesta fase o servidor expõe apenas endpoints de fundação (health e status). Funcionalidades de negócio, autenticação e persistência remota serão adicionadas depois.

---

## Início rápido

```bash
make setup   # primeira vez: instala dependências + cria .env
make dev     # desenvolvimento → http://localhost:<PORT>
```

Na primeira vez, `make setup` cria `.env` a partir de `.env.example`. Se a porta 3000 já estiver em uso, edite `PORT` no `.env` (o exemplo sugere `3001`).

Documentação técnica (dependências, build, variáveis de ambiente):

```text
docs/TECNICO.md
```

---

## Comandos

| Comando | Descrição |
|---|---|
| `make help` | Lista todos os comandos |
| `make setup` | Setup inicial (`npm install` + `.env`) |
| `make env` | Cria `.env` a partir de `.env.example` |
| `make dev` | Servidor com hot reload (`tsx watch`) |
| `make build` | Compila TypeScript para `dist/` |
| `make start` | Build + execução de produção |
| `make run` | Alias para `make dev` |
| `make check` | Valida compilação TypeScript |
| `make health` | Testa os endpoints (servidor rodando) |
| `make clean` | Remove `dist/` |
| `make docker-up` | Sobe server + MariaDB (Docker) |
| `make docker-down` | Para containers Docker |
| `make docker-logs` | Logs dos serviços Docker |
| `make docker-build` | Build das imagens Docker |
| `make docker-clean` | Remove containers e volume do MariaDB |
| `make db-migrate` | Aplica migrations no MariaDB |
| `make db-status` | Status das migrations |
| `make db-migrate-docker` | Migrations via container Docker |

Equivalentes npm (executar dentro de `server/`):

```bash
npm run dev
npm run build
npm run start
```

---

## Endpoints

| Método | Rota | Resposta |
|---|---|---|
| `GET` | `/health` | `{ "ok": true }` |
| `GET` | `/api/v1/status` | `{ "name": "fluxor-server", "version": "0.1.0", "status": "running" }` |
| `GET` | `/api/docs` | Swagger UI — documentação interativa da API |
| `GET` | `/api/openapi.json` | Especificação OpenAPI 3.x (JSON) |

Exemplo:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/status
curl http://localhost:3000/api/openapi.json
# ou abra no navegador: http://localhost:3000/api/docs
```

Ou, com o servidor já rodando:

```bash
make health
```

---

## Documentação da API (OpenAPI / Swagger)

Com o servidor em execução:

| Recurso | URL |
|---|---|
| Swagger UI | `http://localhost:<PORT>/api/docs` |
| OpenAPI JSON | `http://localhost:<PORT>/api/openapi.json` |

A interface Swagger UI permite navegar pelos endpoints, ver schemas de request/response e usar **Try it out** para testes manuais.

```bash
curl http://localhost:3000/api/openapi.json
# ou abra no navegador: http://localhost:3000/api/docs
```

Schemas futuros de módulos (`wallets`, `categories`, etc.) podem ser registrados em `src/plugins/swagger/` sem alterar a configuração principal.

---

## Configuração

Copie o exemplo e ajuste:

```bash
cp .env.example .env
# ou: make env
```

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta HTTP (local e Docker) |
| `HOST` | `0.0.0.0` | Interface de escuta |
| `NODE_ENV` | `development` | Ambiente de execução |
| `DB_HOST` | `localhost` | Host do MariaDB (`mariadb` no Docker) |
| `DB_PORT` | `3306` | Porta do MariaDB |
| `DB_NAME` | `fluxor` | Nome do banco |
| `DB_USER` | `fluxor` | Usuário do banco |
| `DB_PASSWORD` | — | Senha do banco |
| `MARIADB_ROOT_PASSWORD` | — | Senha root do MariaDB (só Docker) |

O `.env` é usado em **dois fluxos**:

1. **Local** — carregado pelo `dotenv` ao rodar `make dev` / `make start`
2. **Docker** — passado ao Compose com `--env-file server/.env` (`make docker-up`)

No Docker, `DB_HOST` do `.env` é ignorado e substituído por `mariadb` (rede interna). A `PORT` do `.env` define o mapeamento `host:container`.

Exemplo no `.env`:

```env
PORT=3001
DB_NAME=fluxor
DB_USER=fluxor
DB_PASSWORD=fluxor_dev_password
MARIADB_ROOT_PASSWORD=fluxor_root_password
```

---

## Relação com o app

```text
fluxor/
├── app/          → cliente (React, Vite, Tauri, SQLite local)
└── server/       → API HTTP (este projeto)
```

Os contratos compartilhados ficam em `app/packages/contracts` e são referenciados pelo servidor via link local (`file:../app/packages/contracts`). Não é um monorepo — cada produto tem seu próprio `package.json`.

---

## Docker (server + MariaDB)

Não é necessário instalar MariaDB na máquina. A partir de `server/`:

```bash
make docker-up      # build + sobe em background
make docker-logs    # acompanhar logs
make docker-down    # parar containers
make docker-clean   # parar e apagar volume do banco
```

O Compose lê `server/.env` automaticamente via Makefile. Endpoints:

```text
http://localhost:<PORT>/health
http://localhost:<PORT>/api/v1/status
http://localhost:<PORT>/api/docs          # Swagger UI
http://localhost:<PORT>/api/openapi.json  # OpenAPI 3.x
```

(`PORT` vem do seu `.env` — ex.: `3001`)

Sem Makefile, na raiz do projeto:

```bash
docker compose --env-file server/.env up -d
```

Detalhes em `docs/TECNICO.md`.

---

## Stack

- Node.js
- TypeScript
- Fastify
- MariaDB (via Docker)
