# Schema SQLite V1 — Fluxor

> Descrição conceitual do schema SQLite antes da implementação real.
> Referência: [modelo-conceitual-v1.md](./modelo-conceitual-v1.md)

**Versão:** 1 · **Última atualização:** junho/2026

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Convenções](#2-convenções)
3. [Entidades](#3-entidades)
   - [Wallet](#31-wallet)
   - [Category](#32-category)
   - [Payee](#33-payee)
   - [PayeeDocument](#34-payeedocument)
   - [PayeePaymentMethod](#35-payeepaymentmethod)
   - [FinancialRecord](#36-financialrecord)
   - [Attachment](#37-attachment)
   - [FinancialRecordHistoryEvent](#38-financialrecordhistoryevent)
   - [SavedFilter](#39-savedfilter)
   - [RecurrenceBatch](#310-recurrencebatch)
   - [TransferLink](#311-transferlink)
4. [Soft delete e arquivamento](#4-soft-delete-e-arquivamento)
5. [Relacionamentos](#5-relacionamentos)
6. [Índices previstos](#6-índices-previstos)
7. [Regras de integridade](#7-regras-de-integridade)
8. [O que não existe no schema V1](#8-o-que-não-existe-no-schema-v1)
9. [Referências cruzadas](#9-referências-cruzadas)

---

## 1. Visão geral

O banco SQLite V1 persiste o domínio offline first do Fluxor. A unidade central é **`FinancialRecord`**. Pagamento/recebimento **não** possui tabela própria — a efetivação vive nos campos do registro.

```
Wallet ──┐
Category ├──► FinancialRecord ◄── Attachment
Payee ───┘         │  ▲
                   │  └── TransferLink (fonte do par; transferGroupId → TransferLink.id)
                   ├── FinancialRecordHistoryEvent
                   ├── RecurrenceBatch (metadados)
                   └── (alertas derivados — sem tabela)
```

---

## 2. Convenções

| Convenção | Descrição |
|---|---|
| **Identificadores** | `TEXT` (UUID ou ULID) — chave primária `id` |
| **Datas** | `TEXT` ISO 8601 (`YYYY-MM-DD` para date; datetime com timezone ou UTC) |
| **Valores monetários** | **`INTEGER` em centavos** — ex.: R$ 129,00 → `12900`. **Não usar `REAL`.** |
| **Booleanos** | `INTEGER` (`0` / `1`) |
| **Enums** | `TEXT` com valores fixos documentados |
| **JSON** | `TEXT` serializado |
| **Timestamps** | `createdAt`, `updatedAt` obrigatórios onde indicado |

### Valores monetários (centavos)

Todos os campos monetários persistidos usam **`INTEGER` em centavos**:

| Campo | Entidade |
|---|---|
| `expectedAmount` | FinancialRecord |
| `effectiveAmount` | FinancialRecord |
| `minValue` / `maxValue` | dentro de `SavedFilter.filtersJson` (quando presentes) |

Qualquer campo monetário futuro deve seguir a mesma regra. Conversão para exibição (`R$`) é responsabilidade da camada de aplicação.

### Arquivamento vs exclusão lógica

| Campo | Significado |
|---|---|
| **`isArchived`** | Ocultar/desativar em telas operacionais (arquivamento) |
| **`deletedAt`** | Exclusão lógica — entidade removida do uso normal |

Consultas operacionais filtram `deletedAt IS NULL` e, quando aplicável, `isArchived = false`.

> Este documento **não contém SQL**. Tipos persistidos são descritos de forma **conceitual** com tipo SQLite alvo quando aplicável.

---

## 3. Entidades

### 3.1 Wallet

**Objetivo:** Carteira lógica — container de registros financeiros. Termo de interface: **Carteira**.

| Campo | Tipo conceitual | Obrigatório | Observações |
|---|---|:---:|---|
| `id` | string (PK) | sim | Identificador único |
| `name` | string | sim | Nome exibido |
| `icon` | string | sim | Chave da lista controlada (`theme.icons`) |
| `color` | string | sim | Cor da paleta controlada |
| `notes` | string | não | Observações livres |
| `isDefault` | boolean (INTEGER) | sim | Default `0`; apenas uma carteira padrão por instalação |
| `isArchived` | boolean (INTEGER) | sim | Default `0`; arquivamento — oculta em telas operacionais |
| `createdAt` | datetime (TEXT) | sim | |
| `updatedAt` | datetime (TEXT) | sim | |
| `deletedAt` | datetime (TEXT) | não | Exclusão lógica |

**Observações gerais:**

- Não armazena dados bancários (agência, conta, PIX, saldo).
- `isArchived` arquiva; `deletedAt` exclui logicamente. Registros vinculados permanecem.
- **Carteira padrão:** apenas uma carteira **ativa** (`deletedAt IS NULL`, `isArchived = false`) com `isDefault = true`. A implementação SQLite **deve garantir unicidade** — via constraint, trigger ou transação atômica; sem SQL neste documento.

---

### 3.2 Category

**Objetivo:** Categoria simples para classificar registros. Sem hierarquia, subcategorias ou metas.

| Campo | Tipo conceitual | Obrigatório | Observações |
|---|---|:---:|---|
| `id` | string (PK) | sim | |
| `name` | string | sim | Nome obrigatório |
| `icon` | string | sim | Lista controlada |
| `color` | string | sim | Paleta controlada |
| `description` | string | não | |
| `isArchived` | boolean (INTEGER) | sim | Default `0`; arquivamento |
| `createdAt` | datetime (TEXT) | sim | |
| `updatedAt` | datetime (TEXT) | sim | |
| `deletedAt` | datetime (TEXT) | não | Exclusão lógica |

**Observações gerais:**

- Registros associados **não** são apagados ao excluir/arquivar categoria.
- Uso recente é lógica de aplicação, não campo persistido nesta V1.
- **Criação rápida (`CreateCategoryQuick`):** mesma tabela `Category`; `icon`/`color` padrão temporários — ver [application-services-v1.md](./application-services-v1.md).

---

### 3.3 Payee

**Objetivo:** Favorecido — pessoa ou entidade auxiliar vinculada opcionalmente a registros. Termo de interface: **Favorecido**.

| Campo | Tipo conceitual | Obrigatório | Observações |
|---|---|:---:|---|
| `id` | string (PK) | sim | |
| `name` | string | sim | Nome obrigatório |
| `notes` | string | não | |
| `isArchived` | boolean (INTEGER) | sim | Default `0`; arquivamento |
| `createdAt` | datetime (TEXT) | sim | |
| `updatedAt` | datetime (TEXT) | sim | |
| `deletedAt` | datetime (TEXT) | não | Exclusão lógica |

**Observações gerais:**

- Sem tipo pessoa/empresa, saldo, avatar ou histórico financeiro próprio.
- Registros mantêm `payeeId` mesmo após exclusão lógica do favorecido.
- **Criação rápida (`CreatePayeeQuick`):** mesma tabela `Payee`; apenas `name` — ver [application-services-v1.md](./application-services-v1.md).

---

### 3.4 PayeeDocument

**Objetivo:** Documento associado a um favorecido (CPF, CNPJ, RG, etc.) — apenas referência, sem validação de formato.

| Campo | Tipo conceitual | Obrigatório | Observações |
|---|---|:---:|---|
| `id` | string (PK) | sim | |
| `payeeId` | string (FK → Payee) | sim | |
| `type` | string | sim | Ex.: `CPF`, `CNPJ`, `RG` |
| `value` | string | sim | Valor informado, sem validação |
| `createdAt` | datetime | sim | |

**Observações gerais:**

- **Não** editar in-place — excluir e recriar.
- Quantidade ilimitada por favorecido.
- Sem soft delete individual nesta V1 — remoção física ou flag futura.

---

### 3.5 PayeePaymentMethod

**Objetivo:** Forma de pagamento de referência do favorecido (PIX, banco, etc.) — **não** participa automaticamente da efetivação de registros.

| Campo | Tipo conceitual | Obrigatório | Observações |
|---|---|:---:|---|
| `id` | string (PK) | sim | |
| `payeeId` | string (FK → Payee) | sim | |
| `type` | string | sim | Ex.: `PIX`, `banco` |
| `value` | string | sim | Valor informado, sem validação |
| `createdAt` | datetime | sim | |

**Observações gerais:**

- **Não** editar in-place — excluir e recriar.
- Quantidade ilimitada por favorecido.
- Apenas referência cadastral.

---

### 3.6 FinancialRecord

**Objetivo:** Registro financeiro central — conta a pagar ou a receber, incluindo efetivação e vínculos de transferência/recorrência.

| Campo | Tipo conceitual | Obrigatório | Observações |
|---|---|:---:|---|
| `id` | string (PK) | sim | |
| `walletId` | string (FK → Wallet) | sim | Carteira proprietária |
| `type` | enum | sim | `payable` \| `receivable` |
| `description` | string | sim | |
| `payeeId` | string (FK → Payee) | **não** | **Opcional** — registro pode existir sem favorecido |
| `categoryId` | string (FK → Category) | sim | |
| `dueDate` | date (TEXT) | sim | Vencimento / previsão |
| `expectedAmount` | integer (centavos) | sim | Valor previsto — ex.: R$ 129,00 → `12900` |
| `effectiveDate` | date (TEXT) | não | Preenchido na efetivação |
| `effectiveAmount` | integer (centavos) | não | Valor efetivado — centavos |
| `recordNote` | string | não | Observação do registro |
| `paymentNote` | string | não | Observação da efetivação |
| `storedStatus` | enum | sim | `pending` \| `completed` — **não** inclui `overdue` |
| `recurrenceGroupId` | string (FK → RecurrenceBatch) | não | Metadados de lote recorrente |
| `recurrenceIndex` | integer | não | Posição no lote (1, 2, 3…) |
| `alertEnabled` | boolean | sim | Default configurável na implementação |
| `alertOffset` | integer | não | Dias de antecedência |
| `transferGroupId` | string (FK → TransferLink) | não | Referencia `TransferLink.id` |
| `createdAt` | datetime (TEXT) | sim | |
| `updatedAt` | datetime (TEXT) | sim | |
| `deletedAt` | datetime (TEXT) | não | Exclusão lógica |

**Observações gerais:**

- **`overdue` não é armazenado** — derivado de `storedStatus = pending` + `dueDate < hoje`.
- **Pagamento não é tabela** — efetivação altera campos desta entidade.
- `storedStatus = completed` implica `effectiveDate` e `effectiveAmount` preenchidos (regra de aplicação).
- Recorrência: registros criados em lote permanecem **independentes** após criação.
- **Transferência:** quando presente, `transferGroupId` aponta para `TransferLink.id`. O par de registros é resolvido via `TransferLink`, não por FK direta entre registros.

### Decisão pendente para V2 — `storedStatus`

**V1:** `storedStatus` persistido (`pending` | `completed`).

**Discussão futura:** status poderia ser derivado de `effectiveDate` / `effectiveAmount` (ex.: `effectiveDate != null` → `completed`). **Decisão atual:** manter `storedStatus` na V1; reavaliar após uso real. **Não remover** nesta etapa.

---

### 3.7 Attachment

**Objetivo:** Anexo local de um registro financeiro — documento da conta ou comprovante.

| Campo | Tipo conceitual | Obrigatório | Observações |
|---|---|:---:|---|
| `id` | string (PK) | sim | |
| `recordId` | string (FK → FinancialRecord) | sim | |
| `kind` | enum | sim | `document` \| `receipt` |
| `label` | string | não | Rótulo descritivo |
| `filename` | string | sim | Nome original |
| `mimeType` | string | sim | |
| `size` | integer | sim | Bytes |
| `localPath` | string (TEXT) | sim | Caminho no filesystem do app |
| `createdAt` | datetime (TEXT) | sim | |
| `deletedAt` | datetime (TEXT) | não | Exclusão lógica |

**Observações gerais:**

- **`document`** = documentos da conta (boleto, fatura).
- **`receipt`** = comprovantes.
- Filtros da Home (`documentState`, `receiptState`) consultam existência por `kind` (registros ativos: `deletedAt IS NULL`).
- Arquivo físico no filesystem; exclusão lógica via `deletedAt`. Remoção do arquivo físico é responsabilidade da camada de aplicação.

---

### 3.8 FinancialRecordHistoryEvent

**Objetivo:** Histórico append-only de eventos de um registro financeiro.

| Campo | Tipo conceitual | Obrigatório | Observações |
|---|---|:---:|---|
| `id` | string (PK) | sim | |
| `recordId` | string (FK → FinancialRecord) | sim | |
| `eventType` | enum | sim | Ver valores abaixo |
| `description` | string | sim | Texto legível |
| `metadata` | json | não | Payload extensível |
| `createdAt` | datetime | sim | |
| `createdBy` | string | não | Origem (futuro multi-usuário) |

**Valores de `eventType`:**

`record_created` · `record_updated` · `payment_registered` · `payment_reverted` · `attachment_added` · `attachment_removed` · `transfer_created` · `transfer_updated` · `alert_created`

**Observações gerais:**

- **Append-only** — sem update ou delete de eventos.
- Efetivação gera `payment_registered`; reversão gera `payment_reverted`.
- **`transfer_created`** e **`transfer_updated`** registram operações de transferência na timeline de **cada registro** do par (origem e destino) — mesma tabela, sem entidade de histórico separada.

---

### 3.9 SavedFilter

**Objetivo:** Filtro salvo da Home — serialização de `HomeFiltersState` para reutilização.

| Campo | Tipo conceitual | Obrigatório | Observações |
|---|---|:---:|---|
| `id` | string (PK) | sim | |
| `name` | string | sim | Nome definido pelo usuário |
| `filtersJson` | json (string) | sim | Espelha `HomeFiltersState` |
| `createdAt` | datetime | sim | |
| `updatedAt` | datetime | sim | |

**Observações gerais:**

- **Não** inclui carteira — carteira ativa vem do contexto da Home.
- Seleção única (V1) refletida no JSON.
- Valores monetários em `filtersJson` (`minValue`, `maxValue`) seguem **INTEGER centavos**.

---

### 3.10 RecurrenceBatch

**Objetivo:** Metadados de um lote de registros criados pelo assistente de recorrência — **rastreabilidade apenas**.

| Campo | Tipo conceitual | Obrigatório | Observações |
|---|---|:---:|---|
| `id` | string (PK) | sim | Igual a `recurrenceGroupId` nos registros |
| `ruleDescription` | string | sim | Descrição legível da regra consumida |
| `startDate` | date | sim | Início do lote |
| `endDate` | date | não | Fim, se aplicável |
| `occurrenceCount` | integer | sim | Quantidade de registros gerados |
| `createdAt` | datetime | sim | |

**Observações gerais:**

- **Não gera registros futuramente** — lote criado uma vez no cadastro.
- Não existe job, scheduler ou regra viva.
- Edição em lote de registros do grupo: **fora do escopo V1**.

---

### 3.11 TransferLink

**Objetivo:** Fonte da relação entre dois registros de transferência entre carteiras. **`TransferLink` é a entidade que define o par** — `FinancialRecord.transferGroupId` referencia `TransferLink.id`.

| Campo | Tipo conceitual | Obrigatório | Observações |
|---|---|:---:|---|
| `id` | string (PK) | sim | Referenciado por `FinancialRecord.transferGroupId` |
| `sourceRecordId` | string (FK → FinancialRecord) | sim | Registro na carteira origem |
| `targetRecordId` | string (FK → FinancialRecord) | sim | Registro na carteira destino |
| `createdAt` | datetime (TEXT) | sim | |

**Observações gerais:**

- Transferência V1 = **dois registros** + **um TransferLink**.
- **`transferGroupId`** em cada registro do par referencia **`TransferLink.id`**.
- Os dois registros devem ter **tipos opostos** (`payable` ↔ `receivable`).
- As **carteiras devem ser diferentes** (`sourceRecord.walletId ≠ targetRecord.walletId`).
- **Não** é pagamento — fluxo dedicado, sem tabela `Payment`.
- **Não** representa operação bancária.
- Alterações relevantes devem sincronizar ambos os registros (regra de aplicação V1).
- **Não existe `transferPairRecordId`** em `FinancialRecord` — o par é obtido via `TransferLink`.

**Operação `CreateTransfer` (serviço):** persiste **1 `TransferLink`** + **2 `FinancialRecord`**.

### Exemplo textual

Transferência de R$ 500,00 da Carteira Pessoal → Carteira Investimentos (15/06/2026):

| Carteira Pessoal (origem) | Carteira Investimentos (destino) |
|---|---|
| `type: payable` | `type: receivable` |
| `expectedAmount: 50000` | `expectedAmount: 50000` |
| `transferGroupId → TransferLink.id` | `transferGroupId → TransferLink.id` |

`TransferLink` liga `sourceRecordId` (Pessoal) a `targetRecordId` (Investimentos). Tipos **opostos**, carteiras **diferentes**.

---

## 4. Soft delete e arquivamento

Padrão unificado em todo o schema V1:

| Campo | Uso |
|---|---|
| **`isArchived`** | Ocultar/desativar em telas operacionais (Wallet, Category, Payee) |
| **`deletedAt`** | Exclusão lógica — entidade fora do uso normal |

| Entidade | `isArchived` | `deletedAt` | Comportamento |
|---|---|---|---|
| **Wallet** | sim | sim | Arquivar ou excluir logicamente; registros preservados |
| **Category** | sim | sim | Registros preservam `categoryId` |
| **Payee** | sim | sim | Registros preservam `payeeId` |
| **FinancialRecord** | — | sim | Oculto nas consultas operacionais |
| **Attachment** | — | sim | Oculto nos filtros document/receipt |
| **PayeeDocument** | — | — | Remoção física (V1) — excluir e recriar |
| **PayeePaymentMethod** | — | — | Remoção física (V1) — excluir e recriar |
| **Demais** | — | — | Append-only ou sem delete |

Consultas padrão da Home e CRUD devem filtrar **`deletedAt IS NULL`** e, quando a entidade possui `isArchived`, **`isArchived = false`**, salvo telas administrativas.

---

## 5. Relacionamentos

```
Wallet 1 ──► N FinancialRecord
Category 1 ──► N FinancialRecord
Payee 1 ──► N FinancialRecord (opcional)
Payee 1 ──► N PayeeDocument
Payee 1 ──► N PayeePaymentMethod
FinancialRecord 1 ──► N Attachment
FinancialRecord 1 ──► N FinancialRecordHistoryEvent
RecurrenceBatch 1 ──► N FinancialRecord (via recurrenceGroupId)
TransferLink 1 ──► 2 FinancialRecord (sourceRecordId + targetRecordId)
FinancialRecord N ──► 0..1 TransferLink (via transferGroupId → TransferLink.id)
```

| De | Para | Cardinalidade | FK |
|---|---|---|---|
| FinancialRecord | Wallet | N:1 | `walletId` |
| FinancialRecord | Category | N:1 | `categoryId` |
| FinancialRecord | Payee | N:0..1 | `payeeId` (opcional) |
| FinancialRecord | RecurrenceBatch | N:0..1 | `recurrenceGroupId` |
| FinancialRecord | TransferLink | N:0..1 | `transferGroupId` |
| Attachment | FinancialRecord | N:1 | `recordId` |
| FinancialRecordHistoryEvent | FinancialRecord | N:1 | `recordId` |
| PayeeDocument | Payee | N:1 | `payeeId` |
| PayeePaymentMethod | Payee | N:1 | `payeeId` |
| TransferLink | FinancialRecord | 1:2 | `sourceRecordId`, `targetRecordId` |

---

## 6. Índices previstos

Índices conceituais para consultas frequentes (Home, filtros, alertas):

| Tabela | Índice | Motivo |
|---|---|---|
| **FinancialRecord** | `(walletId, dueDate)` | Lista da Home por carteira e mês |
| **FinancialRecord** | `(walletId, storedStatus, dueDate)` | Alertas e filtros de status |
| **FinancialRecord** | `(walletId, deletedAt)` | Excluir soft-deleted |
| **FinancialRecord** | `(categoryId)` | Filtro por categoria |
| **FinancialRecord** | `(payeeId)` | Filtro por favorecido |
| **FinancialRecord** | `(recurrenceGroupId)` | Grupo recorrente |
| **FinancialRecord** | `(transferGroupId)` | FK → TransferLink |
| **TransferLink** | `(sourceRecordId)` | Registro origem |
| **TransferLink** | `(targetRecordId)` | Registro destino |
| **Attachment** | `(recordId, kind)` | Filtros document/receipt |
| **Attachment** | `(recordId, deletedAt)` | Anexos ativos |
| **FinancialRecordHistoryEvent** | `(recordId, createdAt)` | Timeline do registro |
| **PayeeDocument** | `(payeeId)` | Listagem por favorecido |
| **PayeePaymentMethod** | `(payeeId)` | Listagem por favorecido |
| **Category** | `(deletedAt, isArchived)` | Listagem ativa |
| **Payee** | `(deletedAt, isArchived)` | Listagem ativa |
| **Wallet** | `(isDefault)` | Carteira padrão |
| **Wallet** | `(isArchived, deletedAt)` | Carteiras ativas |

---

## 7. Regras de integridade

### Status e efetivação

| Regra | Descrição |
|---|---|
| **Sem `overdue` persistido** | Status derivado apenas em leitura |
| **Valores em centavos** | `expectedAmount` e `effectiveAmount` são `INTEGER` ≥ 0 |
| **`completed` consistente** | Deve haver `effectiveDate` e `effectiveAmount` quando `storedStatus = completed` |
| **`pending` limpo** | `effectiveDate`, `effectiveAmount`, `paymentNote` devem ser nulos |
| **Sem tabela Payment** | Efetivação = update em `FinancialRecord` + evento de histórico |

### Favorecido e categoria

| Regra | Descrição |
|---|---|
| **`payeeId` opcional** | FK nullable; registro válido sem favorecido |
| **FK preservada** | Soft delete de Payee/Category **não** anula FK em registros existentes |

### Transferência

| Regra | Descrição |
|---|---|
| **TransferLink é a fonte** | O par é definido por `TransferLink`; `transferGroupId` referencia `TransferLink.id` |
| **Sem `transferPairRecordId`** | Não existe FK direta entre registros do par |
| **Dois registros** | Cada TransferLink liga exatamente dois registros |
| **Tipos opostos** | `payable` numa carteira ↔ `receivable` na outra |
| **Carteiras distintas** | `sourceRecord.walletId ≠ targetRecord.walletId` |
| **Não é efetivação comum** | Fluxo dedicado de transferência |

### Recorrência

| Regra | Descrição |
|---|---|
| **Lote imutável** | RecurrenceBatch não dispara novas inserções após criação |
| **Registros independentes** | Alterar um registro do grupo **não** propaga aos demais (V1) |
| **`recurrenceIndex` único** | Por `(recurrenceGroupId, recurrenceIndex)` dentro do lote |

### Anexos

| Regra | Descrição |
|---|---|
| **`kind` obrigatório** | `document` ou `receipt` — distingue documento de comprovante |
| **Soft delete** | Exclusão lógica via `deletedAt`; consultas ignoram anexos excluídos |
| **`localPath` único** | Evitar duplicata de arquivo ativo por registro (implementação) |

### Carteira

| Regra | Descrição |
|---|---|
| **Uma padrão ativa** | No máximo uma Wallet com `isDefault = true` entre carteiras ativas (`deletedAt IS NULL`, `isArchived = false`) |
| **Unicidade na persistência** | Implementação SQLite deve garantir a regra acima (constraint, trigger ou transação) |
| **Registros órfãos** | Não excluir fisicamente carteira com registros ativos |

### Histórico

| Regra | Descrição |
|---|---|
| **Append-only** | Proibir update/delete em `FinancialRecordHistoryEvent` |

---

## 8. O que não existe no schema V1

| Item | Motivo |
|---|---|
| Tabela **Payment** / **Receipt** | Efetivação no próprio `FinancialRecord` |
| Coluna **`overdue`** | Status calculado |
| Coluna **`transferPairRecordId`** | Par resolvido via `TransferLink` |
| Tipo **`REAL`** para monetário | Valores em `INTEGER` centavos |
| Tabela **Alert** | Alertas derivados em runtime |
| Tabela **RecurrenceRule** viva | Recorrência = lote único + `RecurrenceBatch` |
| **Job** / **Scheduler** | Offline first; sem background |
| Dados **bancários** em Wallet | Carteira lógica apenas |
| **Sync** metadata | Etapa futura |
| **User** completo | Apenas `createdBy` reservado no histórico |
| **Edição em lote de transferências** | Fora do escopo V1 |
| **Edição em lote de recorrências** | Fora do escopo V1 |
| **Notificações nativas** | V2 |
| **Execução em background** | Offline first; sem jobs |
| **Geração automática futura de recorrências** | Recorrência = lote único na criação |

---

## 9. Referências cruzadas

| Documento | Relação |
|---|---|
| [modelo-conceitual-v1.md](./modelo-conceitual-v1.md) | Domínio e regras de negócio |
| [application-services-v1.md](./application-services-v1.md) | Serviços de aplicação |
| [arquitetura-home-widgets.md](./arquitetura-home-widgets.md) | Home, filtros e widgets |
| [TECNICO.md](./TECNICO.md) | Stack e execução |

---

*Próximo passo: traduzir este schema em migrations SQLite e camada de repositório — fora do escopo deste documento.*
