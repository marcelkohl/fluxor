# API Remota V1 — Fluxor

> Contrato HTTP que substituirá o SQLite como fonte de persistência remota.
> Referências: [modelo-conceitual-v1.md](./modelo-conceitual-v1.md) · [sqlite-schema-v1.md](./sqlite-schema-v1.md) · [application-services-v1.md](./application-services-v1.md) · [TECNICO.md](./TECNICO.md)

**Versão:** 1 · **Última atualização:** junho/2026

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Convenções](#2-convenções)
3. [Formato de erros](#3-formato-de-erros)
4. [Wallets](#4-wallets)
5. [Categories](#5-categories)
6. [Payees](#6-payees)
7. [Financial Records](#7-financial-records)
8. [Attachments](#8-attachments)
9. [History](#9-history)
10. [Transfer Links](#10-transfer-links)
11. [Recurrence Batches](#11-recurrence-batches)
12. [Mapeamento Persistence Ports → API](#12-mapeamento-persistence-ports--api)
13. [Fora do escopo V1](#13-fora-do-escopo-v1)
14. [Referências cruzadas](#14-referências-cruzadas)

---

## 1. Visão geral

A API Remota V1 expõe, via HTTP, as mesmas operações hoje realizadas pelos **Persistence Ports** (`src/features/persistence/ports/`). O **Remote API Adapter** traduz chamadas dos ports em requisições HTTP; use cases e UI **não** devem mudar quando o provider remoto for implementado.

```
UI
  ↓
Use Cases
  ↓
Persistence Ports
  ↓
Persistence Provider
    ├─ SQLite Adapter        (implementado)
    └─ Remote API Adapter    (futuro)
            ↓
         HTTP API             ← este documento
            ↓
         Database
```

### Princípios

| Princípio | Descrição |
|---|---|
| **Paridade com ports** | Cada método de repositório tem endpoint(s) correspondente(s) — ver [seção 12](#12-mapeamento-persistence-ports--api). |
| **JSON** | Request e response em `application/json`, salvo upload de anexos (futuro). |
| **Sem autenticação na V1** | Contrato de dados apenas; auth, usuários e tokens ficam fora deste documento. |
| **Estado ativo por padrão** | Listagens retornam entidades operacionais (`deletedAt = null`; `isArchived = false` quando aplicável), espelhando os adapters SQLite. |
| **Centavos inteiros** | Valores monetários nunca em decimal na API. |
| **IDs gerados pelo servidor** | O cliente envia dados de criação; o servidor atribui `id` e timestamps. |

### Base URL

```
{baseUrl}/api/v1
```

Exemplo: `https://api.exemplo.com/api/v1/wallets`

`{baseUrl}` é configurada pelo usuário em `PersistenceSetup` (`localStorage`, chave `fluxor:persistence-config`).

---

## 2. Convenções

### Datas

| Tipo | Formato | Exemplo | Campos |
|---|---|---|---|
| **Date** | ISO 8601, apenas data | `2026-06-09` | `dueDate`, `effectiveDate`, `startDate`, `endDate` |
| **DateTime** | ISO 8601 com timezone (UTC recomendado) | `2026-06-09T14:30:00.000Z` | `createdAt`, `updatedAt`, `deletedAt` |

Datas inválidas ou em formato incorreto retornam `400` com `code: "invalid_date"`.

### Valores monetários

Sempre **inteiros em centavos** (≥ 0).

```json
{
  "expectedAmount": 12990
}
```

**Nunca** enviar decimais:

```json
{
  "expectedAmount": 129.90
}
```

Campos afetados: `expectedAmount`, `effectiveAmount`.

### Identificadores (`id`)

| Aspecto | Convenção |
|---|---|
| **Formato** | UUID versão 4 (RFC 4122), gerado com `crypto.randomUUID()` — mesmo padrão do adapter SQLite (`src/features/database/utils/id.ts`) |
| **Exemplo** | `550e8400-e29b-41d4-a716-446655440000` |
| **Tipo JSON** | `string` |
| **Geração** | Servidor na criação; cliente referencia por URL ou corpo em updates |

FKs (`walletId`, `categoryId`, `payeeId`, `recordId`, etc.) usam o mesmo formato.

### Booleanos

JSON nativo: `true` / `false` (não `0` / `1`).

### Enums

Valores em `string` minúscula, fixos:

| Enum | Valores |
|---|---|
| `FinancialRecordType` | `payable` · `receivable` |
| `StoredStatus` | `pending` · `completed` |
| `AttachmentKind` | `document` · `receipt` |
| `HistoryEventType` | `record_created` · `record_updated` · `payment_registered` · `payment_reverted` · `attachment_added` · `attachment_removed` · `transfer_created` · `transfer_updated` · `alert_created` |

### Campos nulos

Campos opcionais ausentes na criação são persistidos como `null`. Em updates parciais (`PATCH`), campos omitidos **não** alteram o valor existente; enviar `null` explicitamente limpa o campo quando o port permitir (ex.: `payeeId`, `recordNote`).

### Paginação

Listagens suportam paginação opcional via query string. **V1:** adapters podem ignorar paginação e retornar todos os registros ativos; o contrato já define o padrão para evolução.

**Query parameters:**

| Parâmetro | Tipo | Default | Descrição |
|---|---|---|---|
| `page` | integer ≥ 1 | `1` | Página atual |
| `pageSize` | integer 1–100 | `50` | Itens por página |

**Response envelope** (quando paginação solicitada ou lista grande):

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 120,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Sem parâmetros de paginação, o endpoint pode retornar array direto (compatível com ports que retornam `T[]`) **ou** o envelope acima com `page=1` e `pageSize` igual ao total — o Remote API Adapter deve aceitar ambos na implementação.

**Ordenação padrão:**

| Recurso | Ordenação |
|---|---|
| Wallets, Categories, Payees | `name` ascendente (case-insensitive) |
| Financial Records | `dueDate` asc, `createdAt` asc |
| Attachments | `createdAt` asc |
| History events | `createdAt` asc |

### Timestamps de resposta

O servidor define `createdAt`, `updatedAt` e `deletedAt` — o cliente **não** os envia em criação.

### Métodos HTTP

| Método | Uso |
|---|---|
| `GET` | Leitura e listagens |
| `POST` | Criação e ações semânticas (`archive`, `set-default`, `register-payment`, …) |
| `PATCH` | Atualização parcial |
| `DELETE` | Não usado na V1 — remoções são soft delete via `POST …/archive` ou `POST …/remove` |

---

## 3. Formato de erros

Respostas de erro usam status HTTP adequado e corpo JSON uniforme:

```json
{
  "code": "wallet_not_found",
  "message": "Wallet not found"
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `code` | string | Identificador estável em `snake_case` — usado pelo adapter e testes |
| `message` | string | Mensagem legível (pode ser localizada no futuro) |

**Status HTTP comuns:**

| Status | Uso |
|---|---|
| `400` | Validação, formato inválido, regra de negócio rejeitada |
| `404` | Recurso não encontrado ou soft-deleted |
| `409` | Conflito de estado (ex.: efetivar registro já efetivado) |
| `500` | Erro interno |

### Códigos de erro por domínio

| `code` | HTTP | Descrição |
|---|---|---|
| `validation_error` | 400 | Entrada inválida genérica |
| `invalid_date` | 400 | Data em formato incorreto |
| `invalid_amount` | 400 | Valor monetário inválido (negativo ou não inteiro) |
| `wallet_not_found` | 404 | Carteira inexistente ou excluída |
| `wallet_archived` | 400 | Operação não permitida em carteira arquivada |
| `wallet_archived_cannot_be_default` | 400 | Carteira arquivada não pode ser padrão |
| `category_not_found` | 404 | Categoria inexistente ou excluída |
| `payee_not_found` | 404 | Favorecido inexistente ou excluído |
| `financial_record_not_found` | 404 | Registro inexistente ou excluído |
| `financial_record_already_completed` | 409 | Efetivação em registro já `completed` |
| `financial_record_not_completed` | 409 | Reversão em registro `pending` |
| `financial_record_is_transfer` | 400 | Operação não aplicável a registro de transferência |
| `attachment_not_found` | 404 | Anexo inexistente ou removido |
| `transfer_link_not_found` | 404 | Vínculo de transferência inexistente |
| `recurrence_batch_not_found` | 404 | Lote de recorrência inexistente |
| `no_fields_to_update` | 400 | PATCH sem campos editáveis |

---

## 4. Wallets

Entidade: `Wallet` — carteira lógica; termo de interface **Carteira**.

### Modelo

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Carteira Principal",
  "icon": "wallet",
  "color": "blue",
  "notes": "Conta do dia a dia",
  "isDefault": true,
  "isArchived": false,
  "createdAt": "2026-06-09T10:00:00.000Z",
  "updatedAt": "2026-06-09T10:00:00.000Z",
  "deletedAt": null
}
```

---

### Criar carteira

```http
POST /api/v1/wallets
```

**Request:**

```json
{
  "name": "Carteira Principal",
  "icon": "wallet",
  "color": "blue",
  "notes": "Conta do dia a dia",
  "isDefault": false
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `name` | sim | Nome exibido (não vazio após trim) |
| `icon` | sim | Chave da lista controlada (`theme.icons`) |
| `color` | sim | Cor da paleta controlada |
| `notes` | não | Observações |
| `isDefault` | não | Default `false` |

**Response:** `201 Created` — corpo `Wallet`.

**Erros:**

```json
{ "code": "validation_error", "message": "name is required" }
```

Se `isDefault: true`, o servidor remove `isDefault` das demais carteiras ativas atomicamente.

---

### Editar carteira

```http
PATCH /api/v1/wallets/{id}
```

**Request** (pelo menos um campo):

```json
{
  "name": "Carteira Pessoal",
  "icon": "piggy-bank",
  "color": "green",
  "notes": null
}
```

**Response:** `200 OK` — corpo `Wallet`.

**Erros:**

```json
{ "code": "wallet_not_found", "message": "Wallet not found" }
```

```json
{ "code": "no_fields_to_update", "message": "At least one field must be provided" }
```

Não altera `isDefault` nem `isArchived` — usar endpoints dedicados.

---

### Listar carteiras ativas

```http
GET /api/v1/wallets
```

Retorna carteiras com `deletedAt = null` e `isArchived = false`.

**Response:** `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Carteira Principal",
    "icon": "wallet",
    "color": "blue",
    "notes": null,
    "isDefault": true,
    "isArchived": false,
    "createdAt": "2026-06-09T10:00:00.000Z",
    "updatedAt": "2026-06-09T10:00:00.000Z",
    "deletedAt": null
  }
]
```

Query opcional: `?page=1&pageSize=50` — ver [Paginação](#paginação).

---

### Obter carteira por id

```http
GET /api/v1/wallets/{id}
```

Retorna carteira com `deletedAt = null` (inclui arquivadas).

**Response:** `200 OK` — corpo `Wallet`.

**Erros:**

```json
{ "code": "wallet_not_found", "message": "Wallet not found" }
```

---

### Arquivar carteira

```http
POST /api/v1/wallets/{id}/archive
```

Define `isArchived = true`. Se era padrão, remove `isDefault`. Registros financeiros vinculados permanecem intactos.

**Request:** corpo vazio `{}` ou omitido.

**Response:** `200 OK` — corpo `Wallet` atualizado.

**Erros:**

```json
{ "code": "wallet_not_found", "message": "Wallet not found" }
```

---

### Definir carteira padrão

```http
POST /api/v1/wallets/{id}/set-default
```

Define `isDefault = true` na carteira alvo e `isDefault = false` em todas as outras ativas. Apenas uma carteira padrão ativa por instalação/conta.

**Request:** corpo vazio `{}` ou omitido.

**Response:** `200 OK` — corpo `Wallet`.

**Erros:**

```json
{ "code": "wallet_not_found", "message": "Wallet not found" }
```

```json
{ "code": "wallet_archived_cannot_be_default", "message": "Archived wallet cannot be default" }
```

---

## 5. Categories

Entidade: `Category` — categoria simples, sem hierarquia.

### Modelo

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Alimentação",
  "icon": "utensils",
  "color": "orange",
  "description": "Supermercado e refeições",
  "isArchived": false,
  "createdAt": "2026-06-09T10:00:00.000Z",
  "updatedAt": "2026-06-09T10:00:00.000Z",
  "deletedAt": null
}
```

---

### Criar categoria

```http
POST /api/v1/categories
```

**Request:**

```json
{
  "name": "Alimentação",
  "icon": "utensils",
  "color": "orange",
  "description": "Supermercado e refeições"
}
```

**Response:** `201 Created` — corpo `Category`.

**Erros:**

```json
{ "code": "validation_error", "message": "name is required" }
```

---

### Editar categoria

```http
PATCH /api/v1/categories/{id}
```

**Request:**

```json
{
  "name": "Alimentação e Bebidas",
  "description": null
}
```

**Response:** `200 OK` — corpo `Category`.

**Erros:**

```json
{ "code": "category_not_found", "message": "Category not found" }
```

---

### Listar categorias ativas

```http
GET /api/v1/categories
```

Filtro: `deletedAt = null`, `isArchived = false`. Ordenação por `name`.

**Response:** `200 OK` — array de `Category`.

---

### Obter categoria por id

```http
GET /api/v1/categories/{id}
```

**Response:** `200 OK` — corpo `Category`.

**Erros:**

```json
{ "code": "category_not_found", "message": "Category not found" }
```

---

### Arquivar categoria

```http
POST /api/v1/categories/{id}/archive
```

**Response:** `200 OK` — corpo `Category` com `isArchived: true`.

**Erros:**

```json
{ "code": "category_not_found", "message": "Category not found" }
```

---

## 6. Payees

Entidade: `Payee` — favorecido; termo de interface **Favorecido**.

### Modelo

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "name": "Fornecedor XYZ",
  "notes": "Pagamentos mensais",
  "isArchived": false,
  "createdAt": "2026-06-09T10:00:00.000Z",
  "updatedAt": "2026-06-09T10:00:00.000Z",
  "deletedAt": null
}
```

---

### Criar favorecido

```http
POST /api/v1/payees
```

**Request:**

```json
{
  "name": "Fornecedor XYZ",
  "notes": "Pagamentos mensais"
}
```

**Response:** `201 Created` — corpo `Payee`.

---

### Editar favorecido

```http
PATCH /api/v1/payees/{id}
```

**Request:**

```json
{
  "name": "Fornecedor XYZ Ltda",
  "notes": null
}
```

**Response:** `200 OK` — corpo `Payee`.

**Erros:**

```json
{ "code": "payee_not_found", "message": "Payee not found" }
```

---

### Listar favorecidos ativos

```http
GET /api/v1/payees
```

Filtro: `deletedAt = null`, `isArchived = false`.

**Response:** `200 OK` — array de `Payee`.

---

### Obter favorecido por id

```http
GET /api/v1/payees/{id}
```

**Response:** `200 OK` — corpo `Payee`.

**Erros:**

```json
{ "code": "payee_not_found", "message": "Payee not found" }
```

---

### Arquivar favorecido

```http
POST /api/v1/payees/{id}/archive
```

**Response:** `200 OK` — corpo `Payee` com `isArchived: true`.

---

## 7. Financial Records

Entidade: `FinancialRecord` — registro financeiro central (conta a pagar ou a receber).

### Modelo

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "walletId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "payable",
  "description": "Aluguel junho",
  "payeeId": "770e8400-e29b-41d4-a716-446655440002",
  "categoryId": "660e8400-e29b-41d4-a716-446655440001",
  "dueDate": "2026-06-15",
  "expectedAmount": 150000,
  "effectiveDate": null,
  "effectiveAmount": null,
  "recordNote": "Referente ao contrato",
  "paymentNote": null,
  "storedStatus": "pending",
  "recurrenceGroupId": null,
  "recurrenceIndex": null,
  "alertEnabled": true,
  "alertOffset": 3,
  "transferGroupId": null,
  "createdAt": "2026-06-09T10:00:00.000Z",
  "updatedAt": "2026-06-09T10:00:00.000Z",
  "deletedAt": null
}
```

---

### Criar registro

```http
POST /api/v1/financial-records
```

**Request:**

```json
{
  "walletId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "payable",
  "description": "Aluguel junho",
  "categoryId": "660e8400-e29b-41d4-a716-446655440001",
  "dueDate": "2026-06-15",
  "expectedAmount": 150000,
  "payeeId": "770e8400-e29b-41d4-a716-446655440002",
  "recordNote": "Referente ao contrato",
  "alertEnabled": true,
  "alertOffset": 3,
  "recurrenceGroupId": null,
  "recurrenceIndex": null,
  "transferGroupId": null,
  "storedStatus": "pending",
  "effectiveDate": null,
  "effectiveAmount": null,
  "paymentNote": null
}
```

| Campo | Obrigatório | Default | Descrição |
|---|---|---|---|
| `walletId` | sim | — | Carteira proprietária |
| `type` | sim | — | `payable` \| `receivable` |
| `description` | sim | — | Descrição principal |
| `categoryId` | sim | — | Categoria |
| `dueDate` | sim | — | Vencimento / previsão |
| `expectedAmount` | sim | — | Centavos |
| `payeeId` | não | `null` | Favorecido opcional |
| `recordNote` | não | `null` | Observação do registro |
| `alertEnabled` | não | `false` | Alerta habilitado |
| `alertOffset` | não | `null` | Dias de antecedência |
| `recurrenceGroupId` | não | `null` | FK → `RecurrenceBatch.id` |
| `recurrenceIndex` | não | `null` | Posição no lote (1, 2, 3…) |
| `transferGroupId` | não | `null` | FK → `TransferLink.id` |
| `storedStatus` | não | `pending` | Usado em fluxos compostos (transferência, recorrência) |
| `effectiveDate` | não | `null` | Preenchido apenas em criação já efetivada (fluxos especiais) |
| `effectiveAmount` | não | `null` | Centavos |
| `paymentNote` | não | `null` | Observação da efetivação |

**Response:** `201 Created` — corpo `FinancialRecord`.

**Erros:**

```json
{ "code": "wallet_not_found", "message": "Wallet not found" }
```

```json
{ "code": "category_not_found", "message": "Category not found" }
```

```json
{ "code": "invalid_amount", "message": "expectedAmount must be a non-negative integer" }
```

---

### Editar registro

```http
PATCH /api/v1/financial-records/{id}
```

**Request:**

```json
{
  "description": "Aluguel junho — atualizado",
  "categoryId": "660e8400-e29b-41d4-a716-446655440001",
  "dueDate": "2026-06-20",
  "expectedAmount": 155000,
  "payeeId": null,
  "recordNote": "Valor reajustado",
  "alertEnabled": false,
  "alertOffset": null,
  "transferGroupId": null
}
```

Não altera `storedStatus`, `effectiveDate`, `effectiveAmount` nem `paymentNote` — usar endpoints de efetivação.

**Response:** `200 OK` — corpo `FinancialRecord`.

**Erros:**

```json
{ "code": "financial_record_not_found", "message": "Financial record not found" }
```

---

### Listar registros

```http
GET /api/v1/financial-records
```

Filtro: `deletedAt = null`.

**Query parameters:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `walletId` | UUID | Filtra por carteira (equivale a `ListFinancialRecordsFilter`) |
| `page` | integer | Paginação |
| `pageSize` | integer | Paginação |

**Exemplo:**

```http
GET /api/v1/financial-records?walletId=550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK` — array de `FinancialRecord`, ordenado por `dueDate`, `createdAt`.

---

### Obter registro por id

```http
GET /api/v1/financial-records/{id}
```

Filtro: `deletedAt = null`.

**Response:** `200 OK` — corpo `FinancialRecord`.

**Erros:**

```json
{ "code": "financial_record_not_found", "message": "Financial record not found" }
```

---

### Efetivar registro

Equivalente a `registerPayment` no port.

```http
POST /api/v1/financial-records/{id}/register-payment
```

**Request:**

```json
{
  "effectiveDate": "2026-06-14",
  "effectiveAmount": 150000,
  "paymentNote": "PIX confirmado"
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `effectiveDate` | sim | Data da efetivação |
| `effectiveAmount` | sim | Centavos |
| `paymentNote` | não | Observação da efetivação (`null` permitido) |

**Efeito:** define campos de efetivação e `storedStatus = "completed"`.

**Response:** `200 OK` — corpo `FinancialRecord`.

**Erros:**

```json
{ "code": "financial_record_not_found", "message": "Financial record not found" }
```

```json
{ "code": "financial_record_already_completed", "message": "Record is already completed" }
```

```json
{ "code": "financial_record_is_transfer", "message": "Transfer records use a dedicated flow" }
```

---

### Reverter efetivação

Equivalente a `revertPayment` no port.

```http
POST /api/v1/financial-records/{id}/revert-payment
```

**Request:** corpo vazio `{}` ou omitido.

**Efeito:** limpa `effectiveDate`, `effectiveAmount`, `paymentNote`; define `storedStatus = "pending"`.

**Response:** `200 OK` — corpo `FinancialRecord`.

**Erros:**

```json
{ "code": "financial_record_not_completed", "message": "Record is not completed" }
```

---

### Arquivar registro

Exclusão lógica — define `deletedAt` (equivale a `archive` no port / `DeleteRecord` no serviço de aplicação).

```http
POST /api/v1/financial-records/{id}/archive
```

**Request:** corpo vazio `{}` ou omitido.

**Response:** `200 OK` — corpo `FinancialRecord` com `deletedAt` preenchido.

**Erros:**

```json
{ "code": "financial_record_not_found", "message": "Financial record not found" }
```

```json
{ "code": "financial_record_is_transfer", "message": "Cannot archive transfer record in isolation" }
```

---

## 8. Attachments

Entidade: `Attachment` — metadado de anexo vinculado a um registro financeiro.

> **Nota:** No SQLite, o arquivo físico fica em `localPath` no filesystem local. Na API remota, `localPath` representa o identificador de storage no servidor (path ou URI interno) atribuído após upload — contrato de upload de binário fica fora do escopo V1; este documento cobre apenas metadados, espelhando `CreateAttachmentData`.

### Modelo

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "recordId": "880e8400-e29b-41d4-a716-446655440003",
  "kind": "receipt",
  "label": "Comprovante PIX",
  "filename": "comprovante.pdf",
  "mimeType": "application/pdf",
  "size": 245760,
  "localPath": "attachments/990e8400-e29b-41d4-a716-446655440004/comprovante.pdf",
  "createdAt": "2026-06-09T11:00:00.000Z",
  "deletedAt": null
}
```

---

### Criar anexo

```http
POST /api/v1/attachments
```

**Request:**

```json
{
  "recordId": "880e8400-e29b-41d4-a716-446655440003",
  "kind": "receipt",
  "filename": "comprovante.pdf",
  "mimeType": "application/pdf",
  "size": 245760,
  "localPath": "attachments/990e8400-e29b-41d4-a716-446655440004/comprovante.pdf",
  "label": "Comprovante PIX"
}
```

**Response:** `201 Created` — corpo `Attachment`.

**Erros:**

```json
{ "code": "financial_record_not_found", "message": "Financial record not found" }
```

---

### Remover anexo

Exclusão lógica — define `deletedAt`.

```http
POST /api/v1/attachments/{id}/remove
```

**Request:** corpo vazio `{}` ou omitido.

**Response:** `200 OK` — corpo `Attachment` com `deletedAt` preenchido.

**Erros:**

```json
{ "code": "attachment_not_found", "message": "Attachment not found" }
```

---

### Listar anexos de um registro

```http
GET /api/v1/financial-records/{recordId}/attachments
```

Filtro: `deletedAt = null`. Ordenação por `createdAt`.

**Response:** `200 OK`

```json
[
  {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "recordId": "880e8400-e29b-41d4-a716-446655440003",
    "kind": "receipt",
    "label": "Comprovante PIX",
    "filename": "comprovante.pdf",
    "mimeType": "application/pdf",
    "size": 245760,
    "localPath": "attachments/990e8400-e29b-41d4-a716-446655440004/comprovante.pdf",
    "createdAt": "2026-06-09T11:00:00.000Z",
    "deletedAt": null
  }
]
```

---

## 9. History

Entidade: `FinancialRecordHistoryEvent` — timeline append-only de um registro financeiro.

### Modelo

```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "recordId": "880e8400-e29b-41d4-a716-446655440003",
  "eventType": "payment_registered",
  "description": "Pagamento registrado",
  "metadata": "{\"effectiveAmount\":150000}",
  "createdAt": "2026-06-09T12:00:00.000Z",
  "createdBy": null
}
```

| Campo | Descrição |
|---|---|
| `metadata` | JSON serializado em `string` ou `null` — mesmo formato do SQLite |
| `createdBy` | Reservado para multi-usuário futuro; sempre `null` na V1 |

**Valores de `eventType`:** `record_created` · `record_updated` · `payment_registered` · `payment_reverted` · `attachment_added` · `attachment_removed` · `transfer_created` · `transfer_updated` · `alert_created`

---

### Listar eventos de um registro

```http
GET /api/v1/financial-records/{recordId}/history
```

Ordenação por `createdAt` ascendente.

**Response:** `200 OK` — array de `FinancialRecordHistoryEvent`.

**Erros:**

```json
{ "code": "financial_record_not_found", "message": "Financial record not found" }
```

---

### Registrar evento de histórico

> Exigido pelo `FinancialRecordHistoryRepositoryPort.appendEvent`, chamado explicitamente pelos use cases após mutações. Sem este endpoint, o Remote API Adapter não teria paridade com o SQLite.

```http
POST /api/v1/financial-records/{recordId}/history
```

**Request:**

```json
{
  "eventType": "payment_registered",
  "description": "Pagamento registrado",
  "metadata": "{\"effectiveAmount\":150000}",
  "createdBy": null
}
```

**Response:** `201 Created` — corpo `FinancialRecordHistoryEvent`.

Eventos são **append-only** — sem update ou delete.

---

## 10. Transfer Links

Entidade: `TransferLink` — vínculo entre dois registros de transferência entre carteiras. `FinancialRecord.transferGroupId` referencia `TransferLink.id`.

### Modelo

```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440006",
  "sourceRecordId": "880e8400-e29b-41d4-a716-446655440003",
  "targetRecordId": "880e8400-e29b-41d4-a716-446655440007",
  "createdAt": "2026-06-09T10:30:00.000Z"
}
```

---

### Criar vínculo de transferência

```http
POST /api/v1/transfer-links
```

**Request:**

```json
{
  "sourceRecordId": "880e8400-e29b-41d4-a716-446655440003",
  "targetRecordId": "880e8400-e29b-41d4-a716-446655440007"
}
```

**Response:** `201 Created` — corpo `TransferLink`.

> O serviço `CreateTransfer` orquestra: cria dois `FinancialRecord`, um `TransferLink` e define `transferGroupId` em ambos os registros. A API expõe a persistência atômica do link; a orquestração completa permanece no use case (múltiplas chamadas) ou pode evoluir para endpoint composto em versão futura.

**Erros:**

```json
{ "code": "financial_record_not_found", "message": "Financial record not found" }
```

---

### Obter vínculo por id

```http
GET /api/v1/transfer-links/{id}
```

**Response:** `200 OK` — corpo `TransferLink`.

**Erros:**

```json
{ "code": "transfer_link_not_found", "message": "Transfer link not found" }
```

---

## 11. Recurrence Batches

Entidade: `RecurrenceBatch` — metadados de lote de registros recorrentes (rastreabilidade). `id` do lote = `recurrenceGroupId` nos registros.

### Modelo

```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440008",
  "ruleDescription": "Mensal, dia 10, 12 ocorrências",
  "startDate": "2026-06-10",
  "endDate": "2027-05-10",
  "occurrenceCount": 12,
  "createdAt": "2026-06-09T10:00:00.000Z"
}
```

---

### Criar lote de recorrência

```http
POST /api/v1/recurrence-batches
```

**Request:**

```json
{
  "ruleDescription": "Mensal, dia 10, 12 ocorrências",
  "startDate": "2026-06-10",
  "endDate": "2027-05-10",
  "occurrenceCount": 12
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `ruleDescription` | sim | Descrição legível da regra |
| `startDate` | sim | Início do lote |
| `endDate` | não | Fim do lote, se aplicável |
| `occurrenceCount` | sim | Quantidade de registros gerados |

**Response:** `201 Created` — corpo `RecurrenceBatch`.

> O serviço `CreateRecurringRecords` cria o lote e N registros financeiros em sequência. A API expõe a persistência do lote; registros são criados via `POST /financial-records` com `recurrenceGroupId` e `recurrenceIndex`.

---

### Obter lote por id

```http
GET /api/v1/recurrence-batches/{id}
```

**Response:** `200 OK` — corpo `RecurrenceBatch`.

**Erros:**

```json
{ "code": "recurrence_batch_not_found", "message": "Recurrence batch not found" }
```

---

## 12. Mapeamento Persistence Ports → API

| Port | Método | HTTP |
|---|---|---|
| **WalletRepositoryPort** | `create` | `POST /wallets` |
| | `update` | `PATCH /wallets/{id}` |
| | `listActive` | `GET /wallets` |
| | `getById` | `GET /wallets/{id}` |
| | `archive` | `POST /wallets/{id}/archive` |
| | `setDefault` | `POST /wallets/{id}/set-default` |
| **CategoryRepositoryPort** | `create` | `POST /categories` |
| | `update` | `PATCH /categories/{id}` |
| | `listActive` | `GET /categories` |
| | `getById` | `GET /categories/{id}` |
| | `archive` | `POST /categories/{id}/archive` |
| **PayeeRepositoryPort** | `create` | `POST /payees` |
| | `update` | `PATCH /payees/{id}` |
| | `listActive` | `GET /payees` |
| | `getById` | `GET /payees/{id}` |
| | `archive` | `POST /payees/{id}/archive` |
| **FinancialRecordRepositoryPort** | `create` | `POST /financial-records` |
| | `update` | `PATCH /financial-records/{id}` |
| | `list` | `GET /financial-records` |
| | `getById` | `GET /financial-records/{id}` |
| | `registerPayment` | `POST /financial-records/{id}/register-payment` |
| | `revertPayment` | `POST /financial-records/{id}/revert-payment` |
| | `archive` | `POST /financial-records/{id}/archive` |
| **AttachmentRepositoryPort** | `create` | `POST /attachments` |
| | `remove` | `POST /attachments/{id}/remove` |
| | `listByRecord` | `GET /financial-records/{recordId}/attachments` |
| | `getById` | *(implícito em create/remove; sem endpoint dedicado na V1)* |
| **FinancialRecordHistoryRepositoryPort** | `listByRecord` | `GET /financial-records/{recordId}/history` |
| | `appendEvent` | `POST /financial-records/{recordId}/history` |
| **TransferLinkRepositoryPort** | `create` | `POST /transfer-links` |
| | `getById` | `GET /transfer-links/{id}` |
| **RecurrenceBatchRepositoryPort** | `create` | `POST /recurrence-batches` |
| | `getById` | `GET /recurrence-batches/{id}` |

### Ports sem endpoint nesta V1

Estes ports existem no `PersistenceProvider` mas **não** fazem parte do escopo documentado nesta etapa:

| Port | Observação |
|---|---|
| `PayeeDocumentRepositoryPort` | Documentos de favorecido — etapa futura |
| `PayeePaymentMethodRepositoryPort` | Formas de pagamento de favorecido — etapa futura |

---

## 13. Fora do escopo V1

Não faz parte deste contrato:

| Item | Motivo |
|---|---|
| Backend / servidor | Apenas documentação |
| Banco de dados remoto | Implementação do servidor |
| Autenticação, usuários, JWT, refresh token | Etapa futura |
| Rate limiting | Etapa futura |
| Upload/download de binários de anexos | Metadados apenas; storage de arquivos em etapa futura |
| `SavedFilter` | Sem port de listagem no escopo solicitado |
| Exclusão lógica de Wallet/Category/Payee via `deletedAt` | Serviços não documentados na V1 de aplicação |
| Endpoints compostos (`CreateTransfer`, `CreateRecurringRecords`) | Orquestração permanece nos use cases via múltiplas chamadas |
| Webhooks / sync push | Provider remoto é request-response |
| Health check / versionamento de API além de `/api/v1` | Opcional na implementação |

---

## 14. Referências cruzadas

| Documento | Relação |
|---|---|
| [modelo-conceitual-v1.md](./modelo-conceitual-v1.md) | Domínio e regras de negócio |
| [sqlite-schema-v1.md](./sqlite-schema-v1.md) | Schema espelhado pela API |
| [application-services-v1.md](./application-services-v1.md) | Use cases que consomem os ports |
| [TECNICO.md](./TECNICO.md) | Arquitetura de persistência e setup Local/Remoto |

---

*Próximo passo: implementar backend HTTP e Remote API Adapter conforme este contrato — fora do escopo deste documento.*
