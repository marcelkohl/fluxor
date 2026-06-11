# Fluxor

![License](https://img.shields.io/badge/license-BSD%203--Clause-blue)
![Status](https://img.shields.io/badge/status-not%20ready-orange)

Sistema de gestão financeira pessoal com suporte a execução local (SQLite) ou remota via API REST e MariaDB.

## Visão Geral

O Fluxor foi projetado para funcionar em diferentes cenários:

- Desktop local com banco SQLite
- Aplicação Web
- Servidor remoto com API própria
- Arquitetura preparada para múltiplos provedores de persistência

O objetivo do projeto é oferecer uma experiência moderna de gestão financeira, com foco em:

- Controle de receitas e despesas
- Planejamento financeiro
- Efetivação e acompanhamento de pagamentos
- Histórico completo de alterações
- Relatórios e exportações
- Operação offline e online

---

# Principais Recursos

## Carteiras

Organize seus recursos financeiros em múltiplas carteiras:

- Conta corrente
- Conta poupança
- Dinheiro físico
- Cartão pré-pago
- Investimentos
- Outras fontes de recursos

---

## Categorias

Classifique receitas e despesas utilizando categorias personalizadas.

Exemplos:

- Alimentação
- Moradia
- Transporte
- Saúde
- Educação
- Investimentos
- Lazer

---

## Favorecidos

Gerencie pessoas e empresas relacionadas aos lançamentos financeiros.

Exemplos:

- Clientes
- Fornecedores
- Bancos
- Prestadores de serviço
- Imobiliárias

---

## Registros Financeiros

Controle completo de:

- Contas a pagar
- Contas a receber
- Receitas
- Despesas

Cada registro possui:

- valor previsto
- data prevista
- categoria
- carteira
- favorecido
- observações
- status

---

## Efetivação

Os registros podem ser efetivados posteriormente.

Exemplo:

```text
Despesa prevista:
R$ 150,00

Valor efetivo:
R$ 148,75
```

O sistema mantém:

- valor previsto
- valor efetivo
- data prevista
- data efetiva

---

## Histórico

Todas as operações relevantes geram eventos de histórico.

Exemplos:

- criação
- atualização
- efetivação
- reversão de efetivação

---

## Widgets

A Home possui sistema modular de widgets.

Atualmente disponíveis:

- Resumo Financeiro
- Calendário Financeiro
- Valores por Categoria

A arquitetura permite adicionar ou remover widgets de forma independente.

---

## Exportação

Exportação dos dados filtrados da Home:

- PDF
- CSV

A exportação respeita:

- carteira selecionada
- mês selecionado
- filtros ativos

---

## Temas

Sistema de temas desacoplado.

Atualmente:

- Dark
- Light
- Pastel

Novos temas podem ser adicionados sem alteração da aplicação principal.

---

# Arquitetura

## Frontend

Tecnologias:

- React
- TypeScript
- Vite
- Tailwind
- Tauri

Estrutura principal:

```text
app/
├── src/
├── src-tauri/
├── packages/
│   └── contracts/
└── docs/
```

---

## Persistência

O aplicativo utiliza uma camada de abstração de persistência.

```text
Use Cases
↓
Persistence Provider
↓
Repository Ports
↓
Adapters
```

Adapters implementados:

```text
SQLite Adapter
Remote API Adapter
```

---

## Backend

Tecnologias:

- Node.js
- TypeScript
- Fastify
- MariaDB
- Docker

Estrutura:

```text
server/
├── src/
├── Dockerfile
└── docker-compose.yml
```

---

## Contracts Compartilhados

Frontend e Backend compartilham contratos de comunicação.

```text
app/packages/contracts
```

Os contratos definem:

- Requests
- Responses
- Paginação
- Erros
- DTOs

---

# Modos de Operação

## Local

Persistência:

```text
SQLite
```

Disponível na aplicação Desktop.

---

## Remoto

Persistência:

```text
API + MariaDB
```

O app opera diretamente contra a API remota, sem utilizar SQLite local. A mesma UI, widgets e use cases funcionam nos dois modos — apenas o adapter de persistência muda.

---

# Backend API

Documentação OpenAPI:

```text
http://localhost:3009/api/docs
```

Especificação:

```text
http://localhost:3009/api/openapi.json
```

---

# Desenvolvimento

## Frontend

```bash
cd app

npm install

npm run dev
```

---

## Backend

```bash
cd server

npm install

npm run dev
```

---

## Docker

Subir infraestrutura:

```bash
make docker-up
```

Parar:

```bash
make docker-down
```

Logs:

```bash
make docker-logs
```

---

# Status Atual do Projeto

Implementado:

- Wallets
- Categories
- Payees
- Financial Records
- Register Payment
- Revert Payment
- History
- Exportação PDF
- Exportação CSV
- Temas
- Setup Local / Remoto
- API REST
- Swagger
- MariaDB
- Docker
- Remote API Adapter

Em desenvolvimento:

- Autenticação
- Usuários
- Anexos (remoto)
- Recorrências avançadas
- Transferências completas

---

## Remote Persistence MVP

**Status:** Concluído

O app já pode operar diretamente contra a API remota sem utilizar SQLite. A seleção do modo ocorre no Setup Inicial de Persistência (`Local` ou `Remoto`); os use cases permanecem os mesmos — apenas o provider resolvido em runtime muda (`SQLite Adapter` ou `Remote API Adapter`).

---

# Filosofia do Projeto

O Fluxor foi projetado com foco em:

- Arquitetura desacoplada
- Independência da persistência
- Modularidade
- Evolução incremental
- Operação local e remota
- Reutilização de contratos entre cliente e servidor

O objetivo é permitir que a mesma aplicação funcione tanto de forma totalmente local quanto integrada a um servidor remoto, sem necessidade de alterações na interface ou nas regras de negócio.
