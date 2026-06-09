.PHONY: help install env setup dev build start run check clean health \
	db-migrate db-status db-migrate-docker db-status-docker \
	docker-up docker-down docker-logs docker-build docker-clean

NPM := npm
ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/..)
COMPOSE_FILE := $(ROOT)/docker-compose.yml
ENV_FILE := $(if $(wildcard .env),$(abspath .env),$(ROOT)/server/.env.example)
DOCKER_COMPOSE := docker compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE)

ifneq (,$(wildcard .env))
  PORT := $(shell grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2- | tr -d ' "')
  HOST := $(shell grep -E '^HOST=' .env 2>/dev/null | cut -d= -f2- | tr -d ' "')
endif

PORT ?= 3000
HOST ?= 127.0.0.1

.DEFAULT_GOAL := help

help: ## Lista os comandos disponíveis
	@echo "Fluxor Server — comandos de desenvolvimento"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## Instala dependências Node
	$(NPM) install

env: ## Cria .env a partir de .env.example (se não existir)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Criado .env — ajuste PORT/HOST se necessário."; \
	else \
		echo ".env já existe."; \
	fi

setup: install env ## Setup inicial (primeira vez)
	@echo ""
	@echo "Setup concluído. Próximos passos:"
	@echo "  make dev        → desenvolvimento local (tsx watch)"
	@echo "  make docker-up  → server + MariaDB via Docker"
	@echo "  make build      → compilar TypeScript"
	@echo "  make start      → rodar build de produção"

dev: ## Sobe o servidor em modo desenvolvimento (tsx watch)
	$(NPM) run dev

build: ## Compila TypeScript para dist/
	$(NPM) run build

start: build ## Sobe o servidor de produção (node dist/)
	$(NPM) run start

run: dev ## Alias para `make dev`

check: build ## Valida compilação TypeScript

clean: ## Remove artefatos de build
	rm -rf dist node_modules/.cache

db-migrate: ## Aplica migrations no MariaDB (usa server/.env)
	$(NPM) run db:migrate

db-status: ## Lista migrations aplicadas e pendentes
	$(NPM) run db:status

db-migrate-docker: ## Aplica migrations no MariaDB do Docker (container server)
	$(DOCKER_COMPOSE) exec server npm run db:migrate

db-status-docker: ## Status das migrations no MariaDB do Docker (container server)
	$(DOCKER_COMPOSE) exec server npm run db:status

health: ## Testa GET /health e GET /api/v1/status (servidor deve estar rodando)
	@echo "GET /health"
	@curl -sf "http://$(HOST):$(PORT)/health" | (command -v jq >/dev/null 2>&1 && jq . || cat)
	@echo ""
	@echo "GET /api/v1/status"
	@curl -sf "http://$(HOST):$(PORT)/api/v1/status" | (command -v jq >/dev/null 2>&1 && jq . || cat)
	@echo ""

docker-build: ## Build das imagens Docker (server + MariaDB base)
	$(DOCKER_COMPOSE) build

docker-up: env docker-build ## Sobe server + MariaDB em background (lê server/.env)
	$(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "Serviços no ar (variáveis de server/.env). Endpoints:"
	@echo "  http://localhost:$(PORT)/health"
	@echo "  http://localhost:$(PORT)/api/v1/status"

docker-down: ## Para e remove containers
	$(DOCKER_COMPOSE) down

docker-logs: ## Acompanha logs dos serviços
	$(DOCKER_COMPOSE) logs -f

docker-clean: ## Remove containers, redes e volume do MariaDB (apaga dados)
	$(DOCKER_COMPOSE) down -v
