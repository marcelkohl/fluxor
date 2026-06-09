# Fluxor Server — Documentação Técnica

> Referência para desenvolvimento, compilação e execução do **fluxor-server**.
> Mantenha este arquivo atualizado a cada mudança relevante de stack, estrutura ou fluxo de trabalho.

---

## Índice

1. [Visão geral](#visão-geral)
2. [Stack tecnológica](#stack-tecnológica)
3. [Dependências](#dependências)
4. [Pré-requisitos](#pré-requisitos)
5. [Setup inicial](#setup-inicial)
6. [Comandos de desenvolvimento](#comandos-de-desenvolvimento)
7. [Build e execução](#build-e-execução)
8. [Estrutura do projeto](#estrutura-do-projeto)
9. [Configuração e variáveis](#configuração-e-variáveis)
10. [Contratos compartilhados](#contratos-compartilhados)
11. [Persistência MariaDB](#persistência-mariadb)
12. [Migrations e schema](#migrations-e-schema)
13. [Endpoints](#endpoints)
14. [Documentação OpenAPI / Swagger](#documentação-openapi--swagger)
15. [Docker e MariaDB](#docker-e-mariadb)
16. [Solução de problemas](#solução-de-problemas)

---

## Visão geral

O **fluxor-server** é a API HTTP do Fluxor. Opera de forma independente do cliente em `app/`, que cuida da interface (React/Tauri) e da persistência local (SQLite).

| Item | Valor |
|---|---|
| Nome do pacote | `fluxor-server` |
| Versão atual | `0.1.0` |
| Porta padrão | `3000` |
| Estágio atual | Fundação — health + status |
| Cliente relacionado | `app/` (não alterado por este projeto) |

---

## Stack tecnológica

| Camada | Tecnologia | Versão (aprox.) |
|---|---|---|
| Runtime | Node.js | 20+ recomendado |
| Linguagem | TypeScript | 5.8 |
| HTTP | Fastify | 5.x |
| Dev runner | tsx | 4.x |

**Não utilizado neste projeto:** NestJS, Express, banco remoto, Docker.

---

## Dependências

### Produção

| Pacote | Função |
|---|---|
| `fastify` | Framework HTTP — roteamento, plugins, logging |
| `dotenv` | Carrega variáveis de `.env` na inicialização |
| `mysql2` | Driver MariaDB/MySQL (pool, promise API) |
| `@fastify/swagger` | Gera especificação OpenAPI a partir dos schemas das rotas |
| `@fastify/swagger-ui` | Interface Swagger UI em `/api/docs` |
| `@fluxor/contracts` | Tipos compartilhados com o app (`file:../app/packages/contracts`) |

### Desenvolvimento

| Pacote | Função |
|---|---|
| `typescript` | Compilador TS → JS em `dist/` |
| `tsx` | Executa TypeScript diretamente no `dev` (watch mode) |
| `@types/node` | Tipagens para APIs do Node.js |

### Por que cada dependência

**Fastify** — servidor HTTP leve, com boa performance e API de plugins. Escolhido em detrimento de Express/NestJS para manter a fundação simples e explícita.

**tsx** — evita um passo de compilação durante o desenvolvimento. O `npm run dev` usa `tsx watch`, que reinicia o processo ao salvar arquivos em `src/`.

**typescript + tsc** — o build de produção compila apenas o código em `server/src/` para `server/dist/`. O entrypoint de produção é `node dist/index.js`.

**@fluxor/contracts** — link simbólico local para os tipos de request/response definidos no app. Hoje os endpoints iniciais não importam contracts, mas a dependência já está configurada para uso futuro.

---

## Pré-requisitos

- **Node.js** 20 ou superior (LTS recomendado)
- **npm** (incluído com Node)
- **make** (opcional, para atalhos do Makefile)

Verificar:

```bash
node --version
npm --version
```

---

## Setup inicial

Na pasta `server/`:

```bash
make setup
```

Equivale a `npm install` + criação de `.env` (se ausente). Instala Fastify, dotenv, TypeScript, tsx e cria o link para `@fluxor/contracts`.

Se a porta 3000 estiver ocupada:

```bash
cp .env.example .env
# edite PORT=3001 (ou outra porta livre)
```

---

## Comandos de desenvolvimento

Todos os comandos abaixo devem ser executados a partir de `server/`.

### Makefile

| Comando | Ação |
|---|---|
| `make help` | Lista comandos disponíveis |
| `make setup` | `npm install` |
| `make dev` | Servidor com hot reload |
| `make build` | `tsc` → `dist/` |
| `make start` | `build` + `node dist/index.js` |
| `make run` | Alias de `make dev` |
| `make check` | Valida compilação (`tsc`) |
| `make health` | `curl` nos endpoints (servidor rodando) |
| `make clean` | Remove `dist/` |

### npm scripts

| Script | Comando interno | Uso |
|---|---|---|
| `dev` | `tsx watch src/index.ts` | Desenvolvimento |
| `build` | `tsc` | Compilação |
| `start` | `node dist/index.js` | Produção (requer build prévio) |

---

## Build e execução

### Desenvolvimento

```bash
make dev
```

O servidor sobe em `http://localhost:3000` (ou na porta definida por `PORT`). Logs do Fastify aparecem no terminal. Alterações em `src/` reiniciam o processo automaticamente.

### Produção local

```bash
make build
make start
```

Ou em um único passo:

```bash
make start   # já executa build antes
```

Fluxo:

1. `tsc` compila `src/**/*.ts` → `dist/**/*.js`
2. `node dist/index.js` inicia o Fastify

### Validar compilação sem subir o servidor

```bash
make check
```

### Testar endpoints

Com o servidor rodando em outro terminal:

```bash
make health
# ou
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/status
```

---

## Estrutura do projeto

```text
server/
├── Makefile
├── README.md
├── package.json
├── tsconfig.json
├── .gitignore
├── docs/
│   └── TECNICO.md
└── src/
    ├── index.ts          # entrypoint
    ├── app.ts            # monta instância Fastify + rotas
    ├── server.ts         # listen (PORT/HOST)
    ├── config/
    │   └── env.ts        # leitura de variáveis de ambiente
    ├── plugins/
    │   └── swagger/      # OpenAPI + Swagger UI (config centralizada)
    ├── persistence/
    ├── database/
    └── routes/
        ├── health.route.ts
        └── status.route.ts
```

### Fluxo de boot

```text
index.ts
  → buildApp()      (app.ts — cria Fastify, registra rotas)
  → startServer()   (server.ts — app.listen)
```

### Artefatos gerados

| Pasta | Origem | Versionada |
|---|---|---|
| `dist/` | `tsc` | Não (`.gitignore`) |
| `node_modules/` | `npm install` | Não |

---

## Configuração e variáveis

Lidas em `src/config/env.ts` (com `dotenv` carregando `.env` na raiz de `server/`):

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta TCP do servidor |
| `HOST` | `0.0.0.0` | Endereço de bind (`0.0.0.0` = todas as interfaces) |
| `NODE_ENV` | `development` | Ambiente (`development`, `production`, etc.) |
| `DB_HOST` | `localhost` | Host do MariaDB (`mariadb` no Docker) |
| `DB_PORT` | `3306` | Porta do MariaDB |
| `DB_NAME` | `fluxor` | Nome do banco |
| `DB_USER` | `fluxor` | Usuário do banco |
| `DB_PASSWORD` | *(vazio)* | Senha do banco |

Arquivo de referência versionado: `.env.example`. O `.env` local não vai para o git.

Se `PORT` for inválido (não numérico ou fora de 1–65535), o padrão `3000` é usado.

Exemplos:

```bash
# via .env (recomendado)
cp .env.example .env
# PORT=3001

# via shell (sobrescreve .env)
PORT=4000 HOST=127.0.0.1 make dev
NODE_ENV=production make start
```

---

## Contratos compartilhados

Os tipos de API ficam em `app/packages/contracts` e **não são movidos** nesta fase.

### Configuração atual

**`package.json`** — dependência local:

```json
"@fluxor/contracts": "file:../app/packages/contracts"
```

**`tsconfig.json`** — path alias para o TypeScript:

```json
"paths": {
  "@fluxor/contracts": ["../app/packages/contracts/index.ts"],
  "@fluxor/contracts/*": ["../app/packages/contracts/*"]
}
```

### Uso futuro

```typescript
import type { WalletResponse } from "@fluxor/contracts";
```

Como os contracts exportam apenas tipos, o `tsc` remove os imports na compilação — não há impacto no bundle/runtime.

Os ports de persistência importam tipos via `@fluxor/contracts`, resolvido em build por `src/types/fluxor-contracts.d.ts` (evita compilar o pacote `.ts` do app).

---

## Persistência MariaDB

Camada em `src/persistence/`:

```text
persistence/
├── ports/           # interfaces (Wallet, Category, Payee, FinancialRecord)
├── providers/       # PersistenceProvider + createMariadbPersistenceProvider()
├── adapters/mariadb/
│   ├── connection.ts    # pool mysql2, checkDatabaseConnection(), closePool()
│   └── mariadb-*.repository.ts  # placeholders (NotImplementedError)
└── index.ts
```

| Módulo | Função |
|---|---|
| `getPool()` | Cria pool lazy (não conecta no import) |
| `closePool()` | Encerra pool no shutdown (`SIGINT`/`SIGTERM`) |
| `checkDatabaseConnection()` | `SELECT 1` — usado em `/api/v1/status` |
| `app.persistence` | Provider disponível no Fastify para rotas futuras |

Driver: `mysql2` (promise API).

---

## Migrations e schema

Estrutura em `src/database/`:

```text
database/
├── migrations/
│   ├── 001_initial_schema.ts
│   └── index.ts
├── cli/
│   ├── migrate.ts
│   └── status.ts
├── migrate.ts
├── schema-version.ts
└── index.ts
```

| Comando | Ação |
|---|---|
| `npm run db:migrate` / `make db-migrate` | Aplica migrations pendentes |
| `npm run db:status` / `make db-status` | Lista aplicadas e pendentes |
| `make db-migrate-docker` | Executa migrate dentro do container `server` |

Controle em `schema_migrations` (`version`, `name`, `appliedAt`). Idempotente: rodar duas vezes não reaplica a mesma versão.

### Tabelas V1

`wallet`, `category`, `payee`, `payee_document`, `payee_payment_method`, `recurrence_batch`, `financial_record`, `transfer_link`, `attachment`, `financial_record_history_event`

### Adaptações SQLite → MariaDB

| SQLite | MariaDB |
|---|---|
| `TEXT` (UUID) | `VARCHAR(36)` |
| `INTEGER` centavos | `BIGINT` |
| `INTEGER` booleano | `TINYINT(1)` |
| `TEXT` date | `DATE` |
| `TEXT` datetime | `DATETIME(3)` |
| Índice único parcial (`WHERE …`) | Coluna gerada (`activeDefaultKey`, `recurrenceIndexKey`) + `UNIQUE` |
| `metadata TEXT` | `JSON` |

`saved_filter` não faz parte desta etapa (não listada no escopo).

---

## Endpoints

### `GET /health`

Verificação simples de disponibilidade (sem prefixo `/api`).

```json
{ "ok": true }
```

### `GET /api/v1/status`

Metadados do servidor.

```json
{
  "name": "fluxor-server",
  "version": "0.1.0",
  "status": "running",
  "environment": "development",
  "database": {
    "host": "mariadb",
    "port": 3306,
    "name": "fluxor",
    "configured": true
  }
}
```

Ainda não há teste de conexão real com o banco nesta etapa — apenas indica que as variáveis estão configuradas.

---

## Documentação OpenAPI / Swagger

Documentação interativa gerada automaticamente com `@fastify/swagger` e `@fastify/swagger-ui`.

| Recurso | Rota |
|---|---|
| Swagger UI | `GET /api/docs` |
| Especificação OpenAPI | `GET /api/openapi.json` |

Configuração centralizada em `src/plugins/swagger/`:

```text
plugins/swagger/
├── index.ts              # registerSwagger / registerSwaggerUi
├── openapi.config.ts     # info, tags, securitySchemes (bearer reservado)
├── tags.ts               # tags por módulo (System, Wallets, …)
├── register-schemas.ts   # app.addSchema() compartilhados
└── schemas/              # schemas + route docs por domínio
    ├── health.schemas.ts
    └── status.schemas.ts
```

**Ordem de boot:** `registerSwagger` → rotas → `registerSwaggerUi` (em `app.ts`).

Módulos futuros podem adicionar arquivos em `schemas/` e exportar `*RouteDoc` para usar nas rotas, sem alterar a config principal. Schemas de `@fluxor/contracts` podem ser espelhados manualmente aqui até haver geração automática.

---

## Docker e MariaDB

O `docker-compose.yml` fica na **raiz do projeto** (`fluxor/`). O contexto de build inclui `app/packages/contracts` e `server/`.

### Serviços

| Serviço | Imagem / build | Função |
|---|---|---|
| `mariadb` | `mariadb:11.4` | Banco relacional com volume persistente |
| `server` | `server/Dockerfile` | Fastify com hot reload (`tsx watch`) |

O `server` só sobe após o `mariadb` ficar **healthy** (`depends_on` + healthcheck).

### Comandos (a partir de `server/`)

| Comando | Ação |
|---|---|
| `make docker-build` | Build da imagem do server |
| `make docker-up` | Build + `docker compose up -d` |
| `make docker-down` | Para e remove containers |
| `make docker-logs` | `docker compose logs -f` |
| `make docker-clean` | `docker compose down -v` (apaga dados do MariaDB) |

Equivalente na raiz (com integração ao `.env`):

```bash
docker compose --env-file server/.env up -d
docker compose --env-file server/.env down
docker compose --env-file server/.env logs -f
docker compose --env-file server/.env down -v   # limpar volumes
```

O `make docker-*` já passa `--env-file server/.env` automaticamente. Se `.env` não existir, usa `.env.example` como fallback.

### Integração com `server/.env`

Um único arquivo centraliza configuração local e Docker:

| Variável no `.env` | Local (`make dev`) | Docker (`make docker-up`) |
|---|---|---|
| `PORT` | Porta do Fastify | Mapeamento `PORT:PORT` no host |
| `HOST` | Bind do servidor | Sobrescrito para `0.0.0.0` no container |
| `NODE_ENV` | Ambiente | Repassado ao container |
| `DB_HOST` | `localhost` (padrão) | **Sobrescrito** para `mariadb` |
| `DB_PORT` | Porta do banco | Repassado ao container |
| `DB_NAME` | Nome do banco | `MARIADB_DATABASE` no MariaDB |
| `DB_USER` | Usuário | `MARIADB_USER` no MariaDB |
| `DB_PASSWORD` | Senha | `MARIADB_PASSWORD` + credencial do server |
| `MARIADB_ROOT_PASSWORD` | Não usado localmente | Senha root do container MariaDB |

O serviço `server` usa `env_file: server/.env` **e** o Compose interpola `${VAR}` a partir do mesmo arquivo via `--env-file`.

### Variáveis padrão (se ausentes no `.env`)

| Variável | Padrão |
|---|---|
| `PORT` | `3000` |
| `DB_NAME` / `MARIADB_DATABASE` | `fluxor` |
| `DB_USER` / `MARIADB_USER` | `fluxor` |
| `DB_PASSWORD` / `MARIADB_PASSWORD` | `fluxor_dev_password` |
| `MARIADB_ROOT_PASSWORD` | `fluxor_root_password` |

### Hot reload no container

Volumes montados:

- `./server/src` → código com `tsx watch`
- `./app/packages/contracts` → contratos compartilhados (somente leitura)

### Arquivos Docker

| Arquivo | Local |
|---|---|
| `docker-compose.yml` | raiz do projeto |
| `Dockerfile` | `server/` |
| `.dockerignore` | `server/` (+ `.dockerignore` na raiz para o contexto de build) |

### `package-lock.json` e `@fluxor/contracts`

O Docker usa `node:22-alpine` (npm 10+). Dependências `file:../app/packages/contracts` exigem entrada explícita de `../app/packages/contracts` no lock file. Se `npm ci` falhar no build com *Missing: @fluxor/contracts from lock file*, regenere o lock com a mesma versão do Node do container:

```bash
docker run --rm \
  -v "$(pwd)/../app/packages/contracts:/app/app/packages/contracts" \
  -v "$(pwd)/package.json:/app/server/package.json" \
  -v "$(pwd)/package-lock.json:/app/server/package-lock.json" \
  -w /app/server node:22-alpine npm install
```

(executar a partir de `server/`)

---

## Solução de problemas

### `EADDRINUSE` — porta em uso

Outro processo ocupa a porta configurada:

```bash
# edite .env
PORT=3001

make dev
```

Ou identifique o processo:

```bash
ss -tlnp | grep 3000
```

### `Cannot find module` após build

Execute o build antes do start:

```bash
make build && make start
```

### `@fluxor/contracts` não resolve

Reinstale dependências (recria o link local):

```bash
make setup
```

Confirme que `app/packages/contracts/package.json` existe.

### `make health` falha com "connection refused"

O servidor não está rodando. Em outro terminal:

```bash
make dev
```

### TypeScript não compila

```bash
make check
```

Erros aparecem na saída do `tsc`. Arquivos fonte ficam em `src/`; não edite `dist/` manualmente.
