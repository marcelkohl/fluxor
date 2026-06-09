# Fluxor

Aplicativo para gestão financeira pessoal com suporte a múltiplas carteiras, contas a pagar e receber, filtros avançados, widgets analíticos, exportação de relatórios e arquitetura preparada para operação local (SQLite) ou remota (API).

---

## Início rápido

```bash
make setup   # primeira vez: Node + Rust + deps SO (Linux) + ícones + .env
make dev     # frontend no browser → http://localhost:<VITE_DEV_PORT>
make app     # app desktop (SQLite, Tauri)
```

Se a porta 5173 estiver em uso, edite `VITE_DEV_PORT` no `.env` (criado por `make setup` a partir de `.env.example`).

Setup completo, troubleshooting, build desktop, validação de SQLite e detalhes de desenvolvimento:

```text
docs/TECNICO.md
```

---

## Status do Projeto

### Funcionalidades implementadas

#### Cadastros

- Carteiras
- Categorias
- Favorecidos
- Documentos de favorecidos
- Formas de pagamento

#### Registros Financeiros

- Contas a pagar
- Contas a receber
- Efetivação
- Reversão de efetivação
- Histórico de eventos
- Swipe para efetivar diretamente pela Home

#### Home

- Navegação mensal
- Filtros avançados
- Agrupamento por data
- Totais diários
- Exportação PDF
- Exportação CSV

#### Widgets

- Resumo Financeiro
- Calendário Financeiro
- Valores por Categoria

#### Persistência

- SQLite local
- Setup inicial de persistência
- Arquitetura desacoplada via Ports & Adapters
- Preparação para provider remoto

---

## Em desenvolvimento

- Backend remoto
- Adapter Remote API

---

## Planejado

- Recorrências
- Transferências
- Comprovantes
- Anexos
- Notificações
- Autenticação
- Multiusuário

---

## Modos de Execução

### Local

Executado via Tauri.

Características:

- SQLite local
- Offline
- Sem dependência de servidor

### Remoto

Arquitetura preparada.

Status atual:

```text
Ainda não implementado.
```

Será utilizado futuramente através de:

- Backend centralizado
- API HTTP
- Persistência remota

---

## Arquitetura

A aplicação não depende diretamente de SQLite.

Arquitetura atual:

```text
UI
↓
Use Cases
↓
Persistence Ports
↓
Persistence Provider
↓
Persistence Adapter
    ├─ SQLite
    └─ Remote API (futuro)
```

Benefícios:

- desacoplamento da persistência;
- suporte futuro ao backend remoto;
- manutenção do modo local offline;
- facilidade para testes e evolução.

---

## Sistema de Widgets

Widgets são módulos independentes.

Estrutura padrão:

```text
widgets/
└── nome-widget/
    ├── component
    ├── calculations
    ├── types
    └── index
```

Todos os widgets recebem:

```ts
HomeWidgetContext
```

Widgets não acessam:

- SQLite
- repositories
- use cases
- serviços de persistência

---

## Documentação

| Documento | Conteúdo |
|------------|----------|
| docs/TECNICO.md | Setup, comandos, build e arquitetura técnica |
| docs/modelo-conceitual-v1.md | Modelo conceitual do sistema |
| docs/sqlite-schema-v1.md | Schema conceitual SQLite |
| docs/application-services-v1.md | Use cases e serviços da aplicação |
| docs/arquitetura-home-widgets.md | Arquitetura e contratos dos widgets |
| docs/temas-v1.md | Sistema de temas e como adicionar novos |
| docs/sync-v1.md | Estratégia histórica de sincronização |

---

## Stack

- React
- TypeScript
- Vite
- Tauri 2
- Tailwind CSS 4
- SQLite
- Ports & Adapters Architecture

---

## Licença

Projeto privado.