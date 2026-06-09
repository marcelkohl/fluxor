# Modelo Conceitual V1 — Fluxor

> Documentação interna do domínio financeiro do Fluxor, registrada **antes** da implementação de SQLite e CRUD.
> Serve como referência para schema, serviços e regras de negócio nas próximas etapas.

**Versão:** 1 · **Última atualização:** junho/2026

---

## Índice

1. [Conceito central](#1-conceito-central)
   - [Modo de Persistência (Persistence Mode)](#11-modo-de-persistência-persistence-mode)
2. [Wallet (Carteira)](#2-wallet-carteira)
3. [Category (Categoria)](#3-category-categoria)
4. [Payee (Favorecido)](#4-payee-favorecido)
5. [FinancialRecord](#5-financialrecord)
6. [Status](#6-status)
7. [Efetivação](#7-efetivação)
8. [Anexos](#8-anexos)
9. [Histórico](#9-histórico)
10. [Filtros salvos](#10-filtros-salvos)
11. [Transferência entre carteiras](#11-transferência-entre-carteiras)
12. [Recorrência](#12-recorrência)
13. [Alertas](#13-alertas)
14. [Settings (Configurações)](#14-settings-configurações)
15. [Criação rápida (UX)](#15-criação-rápida-ux)
16. [Fora do escopo deste documento](#16-fora-do-escopo-deste-documento)

---

## 1. Conceito central

O Fluxor gira em torno de **`FinancialRecord`** — o registro financeiro é a unidade fundamental do sistema.

| Princípio | Descrição |
|---|---|
| **Registro como núcleo** | Toda operação financeira relevante é modelada como um `FinancialRecord`. |
| **Efetivação, não entidade separada** | Pagamento e recebimento **não** são entidades independentes. São a **efetivação** de um registro — campos e status atualizados no próprio `FinancialRecord`. |
| **Carteira como contexto** | Cada registro pertence a uma única **carteira** (`walletId`). Não existe visão agregada cross-carteira na operação diária. |

```
┌─────────────────────────────────────────┐
│              FinancialRecord            │
│  (pendente → efetivado → revertido)     │
├─────────────────────────────────────────┤
│  Wallet · Category · Payee · Anexos     │
│  Histórico · Transferência (par)        │
└─────────────────────────────────────────┘
```

### 1.1 Modo de Persistência (Persistence Mode)

O Fluxor suporta dois modos de armazenamento de dados, escolhidos pelo usuário no **Setup Inicial de Persistência**:

| Modo | Descrição |
|---|---|
| **Local** | Dados persistidos no dispositivo via adapter SQLite (Tauri/desktop). |
| **Remoto** | Dados persistidos em um servidor centralizado via adapter Remote API (futuro). |

A configuração (`PersistenceConfig`) é armazenada em `localStorage` — **fora** do SQLite — para que o aplicativo saiba qual provider utilizar **antes** de inicializar qualquer banco.

**Princípios:**

- O modo de persistência **não altera** regras de negócio, entidades de domínio nem serviços de aplicação.
- Apenas altera a **implementação da camada de persistência** (qual adapter atende os Persistence Ports).
- Use cases, UI e widgets permanecem iguais; trocam apenas o provider resolvido em runtime.
- Na implementação atual, apenas o modo **Local** (SQLite) está operacional. O modo **Remoto** salva a URL do servidor, mas o adapter ainda não foi implementado.

---

## 2. Wallet (Carteira)

A **Wallet** representa uma **carteira lógica** de organização financeira pessoal.

### O que é

- Container lógico para registros financeiros.
- Unidade de contexto da Home (carteira ativa selecionada no topo).
- Termo oficial da interface: **Carteira**.

### O que NÃO é

- **Não** representa instituição bancária.
- **Não** armazena agência, conta bancária, PIX ou saldo bancário.
- **Não** substitui extrato ou conciliação bancária.

### Campos conceituais

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único |
| `name` | string | Nome exibido (ex.: "Carteira Pessoal") |
| `icon` | string | Referência visual (tema/assets) |
| `color` | string | Cor identificadora |
| `notes` | string? | Observações livres |
| `isDefault` | boolean | Indica carteira padrão |
| `isArchived` | boolean | Carteira arquivada |
| `deletedAt` | datetime? | Exclusão lógica |
| `createdAt` | datetime | Criação |
| `updatedAt` | datetime | Última alteração |

### Regras

- **Apenas uma carteira padrão ativa** (`isDefault = true`) por instalação/usuário — entre carteiras com `deletedAt IS NULL` e `isArchived = false`.
- **Exclusão por soft delete** — arquivamento via `isArchived`; exclusão lógica via `deletedAt`; registros vinculados permanecem.

### Carteira padrão — exigência de implementação

**Regra de negócio:** no máximo **uma** carteira padrão **ativa** pode existir por instalação.

**Observação para implementação SQLite (futura):** a camada de persistência deve **garantir unicidade** da carteira padrão ativa — por exemplo via constraint parcial, trigger ou transação atômica em `SetDefaultWallet`. Este documento **não define SQL**; apenas registra a exigência.

---

## 3. Category (Categoria)

A **Category** representa uma categoria simples usada para organização dos registros financeiros.

### O que é

- Classificação transversal dos `FinancialRecord`.
- Usada em **registros**, **filtros**, **widgets**, **relatórios** e **indicadores**.

### O que NÃO é

- **Não** possui hierarquia.
- **Não** possui subcategorias.
- **Não** possui orçamento, limite financeiro ou meta.

### Campos conceituais

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único |
| `name` | string | Nome exibido (obrigatório) |
| `icon` | string | Ícone da lista controlada (`theme.icons`) |
| `color` | string | Cor da paleta controlada |
| `description` | string? | Descrição opcional |
| `isArchived` | boolean | Categoria arquivada |
| `createdAt` | datetime | Criação |
| `updatedAt` | datetime | Última alteração |
| `deletedAt` | datetime? | Soft delete |

### Regras

- **Nome obrigatório.**
- **Ícone** vem de lista controlada (não texto livre).
- **Cor** vem de paleta controlada (não valor arbitrário do usuário).
- **Exclusão por soft delete** — via `deletedAt` / `isArchived`; registros financeiros associados **devem continuar preservados**.
- Na **criação de registros**, categorias devem ser exibidas **priorizando uso recente**.
- **Criação rápida** durante cadastro de registro: ver [§15](#15-criação-rápida-ux) (`CreateCategoryQuick`).

---

## 4. Payee (Favorecido)

O **Payee** representa uma pessoa, empresa, cliente, fornecedor, prestador ou entidade relacionada a um registro financeiro.

> Termo oficial da interface: **Favorecido**.

### O que é

- Informação **auxiliar** vinculada opcionalmente a `FinancialRecord`.
- Pode ser usado em **registros**, **filtros** e **histórico operacional**.

### O que NÃO é

- O sistema **não diferencia tipos** de favorecido (sem classificação pessoa/empresa).
- **Não** possui saldo.
- **Não** possui histórico financeiro próprio.
- **Não** possui avatar.

### Campos conceituais — `Payee`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único |
| `name` | string | Nome exibido (obrigatório) |
| `notes` | string? | Observações livres |
| `isArchived` | boolean | Favorecido arquivado |
| `createdAt` | datetime | Criação |
| `updatedAt` | datetime | Última alteração |
| `deletedAt` | datetime? | Soft delete |

### Documentos do Favorecido — `PayeeDocument`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único |
| `payeeId` | string | Favorecido vinculado |
| `type` | string | Tipo do documento (ex.: CPF, CNPJ, RG) |
| `value` | string | Valor informado |
| `createdAt` | datetime | Criação |

**Regras:**

- **Não** validar CPF, CNPJ, RG ou outros formatos — apenas armazenar `type` e `value`.
- **Não** editar documento diretamente — excluir e adicionar novamente.
- Quantidade **ilimitada** por favorecido.

### Formas de Pagamento do Favorecido — `PayeePaymentMethod`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único |
| `payeeId` | string | Favorecido vinculado |
| `type` | string | Tipo (ex.: PIX, banco, agência) |
| `value` | string | Valor informado |
| `createdAt` | datetime | Criação |

**Regras:**

- **Não** validar PIX, banco, agência, conta ou outros formatos — apenas armazenar `type` e `value`.
- **Não** editar forma de pagamento diretamente — excluir e adicionar novamente.
- Quantidade **ilimitada** por favorecido.
- São apenas **referência** — **não** participam automaticamente do pagamento de um registro.

### Criação rápida

- Durante a criação de um registro, se o favorecido não existir, pode ser criado rapidamente **apenas com `name`** — ver [§15](#15-criação-rápida-ux) (`CreatePayeeQuick`).
- Após criado, fica **selecionado imediatamente** no registro em edição.

### Soft delete

- Favorecido **não** deve ser removido fisicamente.
- Registros financeiros **continuam mantendo referência histórica** ao `payeeId`.

---

## 5. FinancialRecord

Registro financeiro — conta a pagar ou a receber.

### Campos conceituais

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único |
| `walletId` | string | Carteira proprietária |
| `type` | `payable` \| `receivable` | A pagar ou a receber |
| `description` | string | Descrição principal |
| `payeeId` | string? | Favorecido vinculado (**opcional**) |
| `categoryId` | string | Categoria |
| `dueDate` | date | Data de vencimento / previsão |
| `expectedAmount` | integer | Valor previsto (centavos) |
| `effectiveDate` | date? | Data da efetivação (pagamento/recebimento) |
| `effectiveAmount` | integer? | Valor efetivado (centavos) |
| `recordNote` | string? | Observação do registro |
| `paymentNote` | string? | Observação da efetivação |
| `storedStatus` | `pending` \| `completed` | Status persistido |
| `recurrenceGroupId` | string? | Agrupa registros do mesmo lote recorrente (**opcional**) |
| `recurrenceIndex` | number? | Índice do registro dentro do lote (**opcional**) |
| `alertEnabled` | boolean | Indica se o registro participa de alertas operacionais |
| `alertOffset` | number? | Antecedência em dias antes do vencimento (**opcional**) |
| `transferGroupId` | string? | Referencia `TransferLink.id` — par de transferência |
| `createdAt` | datetime | Criação |
| `updatedAt` | datetime | Última alteração |
| `deletedAt` | datetime? | Soft delete |

### Tipos

| Valor | Significado |
|---|---|
| `payable` | Conta a pagar |
| `receivable` | Conta a receber |

### Regras

- **`payeeId` é opcional** — um registro financeiro **pode existir sem favorecido**.
- Quando presente, referencia um `Payee` existente; ausência não impede criação nem efetivação do registro.
- **`recurrenceGroupId` e `recurrenceIndex` são opcionais** — presentes apenas em registros criados via assistente de recorrência; ver [§12](#12-recorrência).
- **`alertEnabled` e `alertOffset`** configuram participação em alertas derivados — ver [§13](#13-alertas).

---

## 6. Status

### Armazenados (`storedStatus`)

| Valor | Significado |
|---|---|
| `pending` | Aguardando efetivação |
| `completed` | Pago ou recebido |

### Calculados (não armazenados)

| Status derivado | Condição |
|---|---|
| **`overdue` (vencido)** | `storedStatus = pending` **e** `dueDate < data atual` |

> **`overdue` nunca é persistido.** É derivado em tempo de leitura/exibição/filtro.
>
> **`canceled`** e outros status exibidos na UI mock atual serão reavaliados na implementação real — o modelo V1 armazena apenas `pending` e `completed`.

### Decisão pendente para V2

**Atualmente (V1):** `storedStatus` = `pending` | `completed` — campo **persistido**.

**Observação:** o status poderia, no futuro, ser **derivado** dos campos de efetivação, por exemplo:

| Condição | Status derivado |
|---|---|
| `effectiveDate != null` (e `effectiveAmount` preenchido) | `completed` |
| `effectiveDate == null` | `pending` |

**Decisão atual:** **manter `storedStatus` na V1** — explícito, simples para consultas e filtros. **Reavaliar após uso real** do sistema; não remover `storedStatus` nesta etapa.

---

## 7. Efetivação

Efetivação = marcar registro como pago (payable) ou recebido (receivable).

### Registrar pagamento / recebimento

Atualiza o `FinancialRecord`:

| Campo | Ação |
|---|---|
| `effectiveAmount` | Define valor efetivado |
| `effectiveDate` | Define data da efetivação |
| `paymentNote` | Define observação da efetivação |
| `storedStatus` | `completed` |

Gera evento de histórico: `payment_registered`.

### Reverter pagamento / recebimento

Limpa campos de efetivação:

| Campo | Ação |
|---|---|
| `effectiveAmount` | `null` |
| `effectiveDate` | `null` |
| `paymentNote` | `null` |
| `storedStatus` | `pending` |

Gera evento de histórico: `payment_reverted`.

### Regras

- Efetivação **não** cria entidade separada de pagamento.
- Reversão restaura o registro ao estado pendente original (campos de efetivação limpos).
- Transferência entre carteiras **não** usa o fluxo de efetivação comum — ver [§11](#11-transferência-entre-carteiras).

---

## 8. Anexos

Dois tipos distintos de anexo, com propósitos diferentes:

| Tipo (`kind`) | Propósito | Exemplos |
|---|---|---|
| `document` | Documentos da conta | Boleto, fatura, nota fiscal |
| `receipt` | Comprovantes | Recibo, comprovante de transferência |

### Modelo conceitual — `Attachment`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único |
| `recordId` | string | Registro vinculado |
| `kind` | `document` \| `receipt` | Tipo do anexo |
| `label` | string? | Rótulo / tipo descritivo |
| `filename` | string | Nome do arquivo |
| `mimeType` | string | MIME type |
| `size` | number | Tamanho em bytes |
| `localPath` | string | Caminho local no filesystem |
| `createdAt` | datetime | Data de anexação |
| `deletedAt` | datetime? | Exclusão lógica |

### Regras

- Anexos são **locais** (offline first) — `localPath` aponta para storage do app.
- Filtros da Home (`documentState`, `receiptState`) operam sobre a existência de anexos por `kind`.
- Sync de arquivos é escopo futuro.

---

## 9. Histórico

Auditoria e rastreabilidade de alterações em registros.

### Modelo conceitual — `FinancialRecordHistoryEvent`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único |
| `recordId` | string | Registro vinculado |
| `eventType` | string | Tipo do evento (enum) |
| `description` | string | Descrição legível |
| `metadata` | object? | Dados adicionais (JSON) |
| `createdAt` | datetime | Momento do evento |
| `createdBy` | string? | Origem (usuário/sistema — futuro) |

### Eventos previstos (`eventType`)

| Evento | Descrição |
|---|---|
| `record_created` | Registro criado |
| `record_updated` | Registro alterado |
| `payment_registered` | Pagamento/recebimento registrado |
| `payment_reverted` | Efetivação revertida |
| `attachment_added` | Anexo adicionado |
| `attachment_removed` | Anexo removido |
| `transfer_created` | Transferência entre carteiras criada |
| `transfer_updated` | Transferência entre carteiras alterada |
| `alert_created` | Alerta registrado no histórico do registro |

### Eventos de transferência

`transfer_created` e `transfer_updated` são eventos de **`FinancialRecordHistoryEvent`** — **não** entidade nem tabela própria. Aparecem na **timeline** de **cada registro** envolvido no par (origem e destino), registrando a operação de transferência no contexto daquele registro.

### Regras

- Histórico é **append-only** — eventos não são editados ou removidos.
- `metadata` permite extensibilidade sem alterar schema (ex.: valores anteriores em update).

---

## 10. Filtros salvos

Permite ao usuário salvar combinações de filtros da Home para reutilização.

### Modelo conceitual — `SavedFilter`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único |
| `name` | string | Nome do filtro salvo |
| `filtersJson` | string | Serialização de `HomeFiltersState` |
| `createdAt` | datetime | Criação |
| `updatedAt` | datetime | Última alteração |

### Regras

- Filtros salvos **não** incluem carteira — a carteira ativa continua definida no cabeçalho da Home.
- `filtersJson` espelha o contrato de filtros operacionais da Home (V1 — seleção única).
- UI de filtros salvos é escopo futuro.

---

## 11. Transferência entre carteiras

Transferência move valor **entre carteiras lógicas** do Fluxor — não representa operação bancária.

### Modelo V1

- **`CreateTransfer`** persiste **1 `TransferLink`** + **2 `FinancialRecord`** (um em cada carteira).
- **Não** cria entidade bancária.
- **Não** trata como pagamento/recebimento comum — fluxo dedicado de transferência.

### Vínculo — `TransferLink`

| Campo | Descrição |
|---|---|
| `id` | Identificador do vínculo — referenciado por `transferGroupId` nos registros |
| `sourceRecordId` | Registro na carteira origem |
| `targetRecordId` | Registro na carteira destino |
| `createdAt` | Momento da criação |

`FinancialRecord.transferGroupId` referencia **`TransferLink.id`**. O par é resolvido via `TransferLink` — **não** existe `transferPairRecordId`.

### Regras de tipo e carteira

| Regra | Descrição |
|---|---|
| **Tipos opostos** | `payable` numa carteira ↔ `receivable` na outra |
| **Carteiras diferentes** | Origem e destino em carteiras distintas |

| Registro origem | Registro destino |
|---|---|
| `payable` na carteira A | `receivable` na carteira B |
| `receivable` na carteira A | `payable` na carteira B |

### Exemplo textual

Usuário transfere R$ 500,00 da **Carteira Pessoal** para **Carteira Investimentos** em 15/06/2026:

```
Carteira Pessoal (A)              Carteira Investimentos (B)
─────────────────────             ──────────────────────────
FinancialRecord                   FinancialRecord
  type: payable                     type: receivable
  expectedAmount: 50000             expectedAmount: 50000
  transferGroupId: TL-1             transferGroupId: TL-1

              TransferLink (TL-1)
              sourceRecordId → registro em A
              targetRecordId → registro em B
```

Interpretação: saída a pagar na carteira A; entrada a receber na carteira B — mesmo valor, mesma data, vínculo explícito.

### Sincronização

Alterações relevantes (valor, data, descrição) devem **manter os dois registros sincronizados** via `UpdateTransfer`. **Edição em lote de transferências** fica fora do escopo V1.

```
Carteira A                    Carteira B
┌──────────────────┐          ┌──────────────────┐
│ payable          │◄────────►│ receivable       │
│ transferGroupId  │ Transfer │ transferGroupId  │
│    → TransferLink│   Link   │    → TransferLink│
└──────────────────┘          └──────────────────┘
```

---

## 12. Recorrência

A **recorrência** no Fluxor **não é uma regra viva**. Funciona como um **assistente de criação em lote** no momento do cadastro.

### Princípios

| Princípio | Descrição |
|---|---|
| **Criação imediata** | Ao salvar um registro recorrente, o sistema cria **imediatamente** os registros futuros conforme a regra definida. |
| **Independência** | Depois de criados, os registros são **independentes** — cada um com valor, data, observação, anexos e status próprios. |
| **Sem monitoramento** | O sistema **não** monitora nem cria registros automaticamente no futuro. |
| **Sem automação** | **Não** existe job, scheduler ou geração mensal automática. |
| **Redução de trabalho manual** | A recorrência existe para **reduzir trabalho manual no momento do cadastro**, não para manter uma regra ativa. |

### Exemplos de regras (assistente)

Regras possíveis no assistente de cadastro — aplicadas **uma vez**, na criação:

- Todo mês
- A cada X dias
- Toda terça-feira
- Toda segunda terça-feira do mês
- Até uma data final
- Pelos próximos X dias/meses

> A regra é **consumida na criação** e registrada como descrição no `RecurrenceBatch`; não permanece executando.

### Campos em `FinancialRecord`

| Campo | Descrição |
|---|---|
| `recurrenceGroupId` | ID compartilhado pelos registros do mesmo lote (**opcional**) |
| `recurrenceIndex` | Posição sequencial no lote — ex.: 1, 2, 3… (**opcional**) |

Registros **sem** recorrência não possuem esses campos.

### Modelo conceitual — `RecurrenceBatch` (opcional)

Metadados do lote, para **rastreabilidade** — não gera registros depois da criação inicial.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único (=`recurrenceGroupId`) |
| `ruleDescription` | string | Descrição legível da regra usada (ex.: "Todo mês até dez/2026") |
| `startDate` | date | Data inicial do lote |
| `endDate` | date? | Data final, se aplicável |
| `occurrenceCount` | number | Quantidade de registros gerados |
| `createdAt` | datetime | Momento da criação do lote |

### Regras

- **`RecurrenceBatch` não gera registros depois** — serve apenas para rastreabilidade e consulta futura.
- **Alterar um registro não altera os demais** do grupo nesta V1.
- **Edição em lote de recorrências** (alterar/cancelar todos de uma vez) fica **fora do escopo V1**.
- **Geração automática futura** de registros recorrentes (scheduler, regra viva) fica **fora do escopo V1**.
- Filtro `recurringState` na Home opera sobre registros com ou sem `recurrenceGroupId`.

```
Cadastro com recorrência
        ↓
Assistente aplica regra (uma vez)
        ↓
N × FinancialRecord criados (independentes)
        +
RecurrenceBatch (metadados do lote)
```

---

## 13. Alertas

Os **alertas** na V1 são **operacionais e derivados** — calculados em tempo de uso do app, sem automação em background.

### Princípios V1

| Princípio | Descrição |
|---|---|
| **Sem background** | Alertas **não** dependem de serviço em background, scheduler ou job. |
| **Cálculo sob demanda** | Alertas são **calculados quando o app é aberto** ou quando a **Home é atualizada**. |
| **Sem promessa offline push** | **Não** prometer execução ou aviso quando o app estiver fechado. |
| **Sem entidade complexa** | **Não** criar entidade dedicada de alerta nesta V1 — derivação a partir de `FinancialRecord`. |

### O que NÃO é V1

- **Notificações nativas** do sistema operacional.
- **Background service** ou execução periódica.
- **Scheduler** ou geração automática de avisos com app fechado.

> Notificações nativas podem ser **avaliadas futuramente como V2**.

### Experiência na Home

- O ícone de **notificações** (sino) na Home pode exibir **badge/bullet** quando houver registros relevantes.
- Ao tocar no sino, o usuário vê um **resumo operacional** dos registros pertinentes — não um centro de notificações push.

### Exemplos de agrupamento no resumo

| Grupo | Condição típica |
|---|---|
| Contas vencidas | `storedStatus = pending` e `dueDate < hoje` |
| Contas vencendo hoje | `storedStatus = pending` e `dueDate = hoje` |
| Contas vencendo amanhã | `storedStatus = pending` e `dueDate = amanhã` |
| Contas no intervalo futuro | `storedStatus = pending` e `dueDate` dentro de intervalo configurável (futuro) |

### Campos em `FinancialRecord`

| Campo | Descrição |
|---|---|
| `alertEnabled` | Se `true`, o registro entra no cálculo de alertas |
| `alertOffset` | Dias de antecedência opcionais antes de `dueDate` |

### Derivação do alerta

O alerta **não é armazenado** como entidade separada. É **derivado** de:

```
alertEnabled = true
+ storedStatus = pending
+ dueDate (± alertOffset)
+ data atual (referência do app)
+ carteira ativa (contexto da Home)
```

Registros com `storedStatus = completed` **não** entram em alertas de vencimento.

### Configuração futura

- Intervalo configurável para “vencendo nos próximos X dias” — área **Alertas** em Settings (escopo futuro de UI).
- Preferências globais de alerta **não** fazem parte deste documento.

---

## 14. Settings (Configurações)

A tela de **Configurações** é um **índice administrativo** do app.

### Princípios

- **Não** concentra edição direta de configurações complexas na mesma tela.
- Cada item do índice **abre sua própria área** dedicada.

### Áreas previstas

| Área | Descrição resumida |
|---|---|
| Fonte de Dados | Modo de persistência atual (Local/Remoto) e reconfiguração |
| Dados do Usuário | Informações do perfil local |
| Carteiras | Gestão de carteiras |
| Favorecidos | Gestão de favorecidos |
| Categorias | Gestão de categorias |
| Alertas | Preferências de intervalo e exibição de alertas operacionais |
| Widgets | Preferências de widgets da Home |
| Feriados | Calendário de feriados (futuro) |
| Backup e Exportação | Export/import de dados |
| Sobre | Informações do app |

### Regras

- Settings é **navegação**, não formulário monolítico.
- CRUD de cada área será implementado em telas próprias — escopo futuro.

---

## 15. Criação rápida (UX)

Atalhos de interface durante o cadastro de um **`FinancialRecord`**. **Não** são entidades, tabelas ou serviços de persistência independentes — delegam aos serviços existentes.

| Atalho UX | Serviço de persistência |
|---|---|
| `CreateCategoryQuick` | `CreateCategory` |
| `CreatePayeeQuick` | `CreatePayee` |

### Fluxo comum

1. Usuário está **criando ou editando** um registro.
2. Ao buscar categoria ou favorecido, digita um **nome inexistente**.
3. UI oferece **criar imediatamente** o item.
4. Serviço de aplicação invoca `CreateCategory` ou `CreatePayee` com dados mínimos.
5. Item retornado fica **selecionado** no registro atual (`categoryId` ou `payeeId`).

### CreateCategoryQuick

| Aspecto | Regra |
|---|---|
| **Entrada obrigatória** | `name` |
| **Valores padrão** | `icon` e `color` recebem valores **padrão temporários** da aplicação (primeiro ícone/cor da lista controlada ou default do tema) |
| **Persistência** | Mesma entidade `Category` — mesma tabela, mesmas regras de soft delete |
| **Pós-criação** | `categoryId` selecionado no formulário do registro |

O usuário pode personalizar ícone e cor depois em Configurações → Categorias.

### CreatePayeeQuick

| Aspecto | Regra |
|---|---|
| **Entrada obrigatória** | `name` |
| **Persistência** | Mesma entidade `Payee` |
| **Pós-criação** | `payeeId` selecionado no formulário do registro |

---

## 16. Fora do escopo deste documento

Os itens abaixo serão tratados em documentos ou etapas dedicadas:

| Item | Etapa |
|---|---|
| Schema SQLite final | Implementação de persistência |
| Migrations | Implementação de persistência |
| Telas e fluxos de UI | CRUD e features |
| CRUD completo | Etapas de feature |
| Sync de arquivos/dados (Sync V1) | Suspenso — ver [sync-v1.md](./sync-v1.md) |
| Adapter Remote API | Etapa futura — backend centralizado |
| Implementação do assistente de recorrência | Etapa futura (CRUD) |
| Edição em lote de recorrências | Fora do escopo V1 |
| Edição em lote de transferências | Fora do escopo V1 |
| Geração automática futura de recorrências | Fora do escopo V1 — sem scheduler ou regra viva |
| Implementação da UI de alertas (sino, resumo) | Etapa futura (CRUD/Home) |
| Notificações nativas do SO | V2 — fora do escopo V1 |
| Execução em background (jobs, scheduler) | Fora do escopo V1 |
| Telas e fluxos de Settings | Etapas de feature |

---

## Relação com o código atual (referência)

| Conceito V1 | Código atual | Observação |
|---|---|---|
| `Wallet` | `AccountWallet` / SQLite | Renomeação técnica em etapa futura |
| `Category` | `Category` / SQLite | CRUD em Configurações → Categorias |
| `Payee` | `Payee` / SQLite | CRUD em Configurações → Favorecidos |
| `FinancialRecord` | `FinancialRecord` / SQLite | Home integrada; UI de CRUD completo pendente |
| `Persistence Mode` | `PersistenceConfig` | Local (SQLite) ou Remoto (futuro) via `localStorage` |
| `storedStatus` | `status` | UI usa `pending` / `completed` / `canceled` |
| `dueDate` | `date` | Nome de exibição na Home |
| `expectedAmount` | `amount` / `expectedAmountCents` | Centavos na persistência |
| Anexos | SQLite (infra) | UI de anexos não implementada |
| Histórico | SQLite (infra) | Timeline não exposta na UI |
| Transferência | SQLite (infra) | UI não implementada |
| Criação rápida | — | `CreateCategoryQuick` / `CreatePayeeQuick` — UX pendente |
| Recorrência | `isRecurring` (mock) | Mock simplificado; V1 usa `recurrenceGroupId` + `RecurrenceBatch` |
| Alertas | — | Botão sino sem ação; campos `alertEnabled`/`alertOffset` não no mock |

---

*Documento alinhado ao schema e serviços V1 — revisar antes de implementar SQLite.*
