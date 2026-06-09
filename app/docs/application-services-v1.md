# Serviços de Aplicação V1 — Fluxor

> Descrição das responsabilidades dos serviços de aplicação (use cases) do domínio V1.
> Referências: [modelo-conceitual-v1.md](./modelo-conceitual-v1.md) · [sqlite-schema-v1.md](./sqlite-schema-v1.md) · [TECNICO.md](./TECNICO.md)

**Versão:** 1 · **Última atualização:** junho/2026

---

## Índice

1. [Visão geral](#1-visão-geral)
   - [Camada de persistência](#camada-de-persistência)
2. [Convenções transversais](#2-convenções-transversais)
3. [Wallet Services](#3-wallet-services)
4. [Category Services](#4-category-services)
5. [Payee Services](#5-payee-services)
6. [FinancialRecord Services](#6-financialrecord-services)
7. [Payment Services](#7-payment-services)
8. [Transfer Services](#8-transfer-services)
9. [Recurrence Services](#9-recurrence-services)
10. [Attachment Services](#10-attachment-services)
11. [SavedFilter Services](#11-savedfilter-services)
12. [Criação rápida (UX)](#12-criação-rápida-ux)
13. [O que não existe como serviço na V1](#13-o-que-não-existe-como-serviço-na-v1)

---

## 1. Visão geral

Os **serviços de aplicação** (use cases em `src/features/*/application/`) orquestram regras de negócio, validações e efeitos colaterais sobre o domínio V1. Eles **não** conhecem UI nem detalhes de implementação de banco — delegam leitura/gravação via **Persistence Ports**, resolvidos em runtime pelo **Persistence Provider**.

```
UI / Features
      ↓
Use Cases (Application Services)  ← este documento
      ↓
Persistence Ports
      ↓
Persistence Provider  ← resolvePersistence()
      ↓
Persistence Adapter
    ├─ SQLite (implementado)
    └─ Remote API (futuro)
```

Princípios:

| Princípio | Descrição |
|---|---|
| **Um caso de uso por serviço** | Cada operação nomeada representa uma intenção explícita do usuário ou do sistema. |
| **Validação na aplicação** | Regras de negócio vivem nos serviços, não na UI. |
| **Sem dependência direta de SQLite** | Use cases chamam `resolvePersistence()` e consomem ports (`wallets`, `categories`, `financialRecords`, etc.). |
| **Histórico no registro financeiro** | Apenas `FinancialRecord` possui timeline (`FinancialRecordHistoryEvent`) na V1. |
| **Centavos inteiros** | Valores monetários são `INTEGER` em centavos em toda a camada. |
| **Sem tabela Payment** | Efetivação é serviço dedicado que altera `FinancialRecord`. |

### Camada de persistência

| Camada | Localização | Responsabilidade |
|---|---|---|
| **Persistence Ports** | `src/features/persistence/ports/` | Contratos de repositório por entidade (`WalletRepositoryPort`, `CategoryRepositoryPort`, …) |
| **Persistence Provider** | `src/features/persistence/providers/` | Agrega todos os ports; retornado por `resolvePersistence()` |
| **Adapter SQLite** | `src/features/persistence/adapters/sqlite/` | Implementação atual dos ports via `tauri-plugin-sql` |
| **Adapter Remote API** | — | **Não implementado** — `resolvePersistence()` lança erro controlado no modo remoto |
| **Setup de persistência** | `src/features/persistence-setup/` | Escolha Local/Remoto; config em `localStorage` (fora do SQLite) |

**Fluxo típico em um use case:**

```typescript
const { wallets } = await resolvePersistence();
return wallets.listActive();
```

Os re-exports em `src/features/*/repositories/*.ts` permanecem por compatibilidade, mas novos use cases devem depender exclusivamente de `resolvePersistence()` e dos ports.

**Estado atual:**

- Modo **Local** → provider SQLite (único adapter implementado).
- Modo **Remoto** → configuração salva; provider remoto ainda não existe.
- A arquitetura já permite trocar o adapter sem alterar regras de negócio nos use cases.

---

## 2. Convenções transversais

### Entradas comuns

| Campo | Uso |
|---|---|
| `id` | Identificador da entidade alvo (update, archive, delete, restore) |
| `now` | Timestamp de referência injetado pelo chamador (testabilidade) |

### Valores monetários

Todos os valores de entrada e persistência (`expectedAmount`, `effectiveAmount`, `minValue`, `maxValue` em filtros) são **inteiros em centavos** ≥ 0.

### Arquivamento vs exclusão lógica

| Mecanismo | Campo | Entidades |
|---|---|---|
| Arquivamento | `isArchived = true` | Wallet, Category, Payee |
| Exclusão lógica | `deletedAt = now` | Wallet, Category, Payee, FinancialRecord, Attachment |

Serviços de **arquivamento** deste documento alteram `isArchived`. Exclusão lógica de cadastros (Wallet, Category, Payee) via `deletedAt` fica fora do escopo desta V1 documentada — pode ser adicionada em etapa futura.

### Histórico (`FinancialRecordHistoryEvent`)

Eventos possíveis na V1:

`record_created` · `record_updated` · `payment_registered` · `payment_reverted` · `attachment_added` · `attachment_removed` · `transfer_created` · `transfer_updated` · `alert_created`

`transfer_created` e `transfer_updated` são eventos de **`FinancialRecordHistoryEvent`** — aparecem na timeline de **cada registro** envolvido na transferência (origem e destino).

Serviços que **não** operam sobre `FinancialRecord` retornam **Nenhum** em histórico gerado.

### Decisão pendente para V2 — status do registro

**V1:** `storedStatus` persistido (`pending` | `completed`).

**Discussão futura:** derivar status de `effectiveDate` / `effectiveAmount`. **Decisão atual:** manter `storedStatus` na V1; reavaliar após uso real. Serviços de efetivação continuam atualizando `storedStatus` explicitamente.

### Resultado

Cada serviço retorna a entidade (ou entidades) afetadas e/ou identificadores criados. Formato exato de retorno será definido na implementação.

---

## 3. Wallet Services

### CreateWallet

**Objetivo:** Criar uma nova carteira lógica.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `name` | sim | Nome exibido |
| `icon` | sim | Chave da lista controlada (`theme.icons`) |
| `color` | sim | Cor da paleta controlada |
| `notes` | não | Observações |
| `isDefault` | não | Default `false` |

**Validações:**

- `name` não vazio (após trim).
- `icon` pertence à lista controlada.
- `color` pertence à paleta controlada.
- Se `isDefault = true`, não pode existir outra carteira ativa com `isDefault = true` (`deletedAt IS NULL`, `isArchived = false`).

**Efeitos colaterais:**

- Persiste `Wallet` com `isArchived = false`, `deletedAt = null`, `createdAt` e `updatedAt`.
- Se `isDefault = true`, remove flag `isDefault` da carteira padrão anterior.

**Histórico gerado:** Nenhum.

---

### UpdateWallet

**Objetivo:** Alterar dados editáveis de uma carteira existente.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `walletId` | sim | Carteira alvo |
| `name` | não | Novo nome |
| `icon` | não | Novo ícone |
| `color` | não | Nova cor |
| `notes` | não | Novas observações |

**Validações:**

- Carteira existe, `deletedAt IS NULL`.
- Pelo menos um campo editável informado.
- Mesmas regras de `name`, `icon` e `color` do CreateWallet, quando informados.

**Efeitos colaterais:**

- Atualiza campos informados e `updatedAt`.
- Não altera `isDefault` nem `isArchived` (serviços dedicados).

**Histórico gerado:** Nenhum.

---

### ArchiveWallet

**Objetivo:** Arquivar carteira — ocultar em telas operacionais sem excluir registros vinculados.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `walletId` | sim | Carteira a arquivar |

**Validações:**

- Carteira existe, `deletedAt IS NULL`, `isArchived = false`.
- Carteira arquivada **não** pode ser a única carteira ativa restante se for a carteira padrão — deve haver alternativa ou reatribuição de padrão (política de UI; serviço pode exigir outra carteira ativa antes de arquivar a padrão).

**Efeitos colaterais:**

- Define `isArchived = true` e atualiza `updatedAt`.
- Registros financeiros da carteira **permanecem** intactos.
- Se era `isDefault = true`, remover flag de padrão ou exigir `SetDefaultWallet` prévio (decisão de implementação — documentado como efeito a tratar).

**Histórico gerado:** Nenhum.

---

### SetDefaultWallet

**Objetivo:** Definir a carteira padrão da instalação.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `walletId` | sim | Carteira a tornar padrão |

**Validações:**

- Carteira existe, `deletedAt IS NULL`, `isArchived = false`.

**Efeitos colaterais:**

- Define `isDefault = false` em todas as outras carteiras ativas.
- Define `isDefault = true` na carteira alvo e atualiza `updatedAt`.

**Regra de negócio:** apenas **uma** carteira padrão **ativa** por instalação. A implementação SQLite **deve garantir unicidade** (constraint, trigger ou transação atômica — sem SQL neste documento).

**Histórico gerado:** Nenhum.

---

## 4. Category Services

### CreateCategory

**Objetivo:** Criar categoria para classificação de registros.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `name` | sim | Nome exibido |
| `icon` | sim | Lista controlada |
| `color` | sim | Paleta controlada |
| `description` | não | Descrição opcional |

**Validações:**

- `name` não vazio (após trim).
- `icon` e `color` dentro das listas controladas.

**Efeitos colaterais:**

- Persiste `Category` com `isArchived = false`, `deletedAt = null`, timestamps.
- Usado também por `CreateCategoryQuick` (mesma persistência, defaults de `icon`/`color`).

**Histórico gerado:** Nenhum.

---

### UpdateCategory

**Objetivo:** Alterar categoria existente.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `categoryId` | sim | Categoria alvo |
| `name` | não | Novo nome |
| `icon` | não | Novo ícone |
| `color` | não | Nova cor |
| `description` | não | Nova descrição |

**Validações:**

- Categoria existe, `deletedAt IS NULL`.
- Pelo menos um campo editável informado.
- Regras de `name`, `icon`, `color` quando informados.

**Efeitos colaterais:**

- Atualiza campos e `updatedAt`.
- Registros vinculados mantêm `categoryId`.

**Histórico gerado:** Nenhum.

---

### ArchiveCategory

**Objetivo:** Arquivar categoria — ocultar em seleções operacionais.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `categoryId` | sim | Categoria a arquivar |

**Validações:**

- Categoria existe, `deletedAt IS NULL`, `isArchived = false`.

**Efeitos colaterais:**

- Define `isArchived = true` e atualiza `updatedAt`.
- Registros existentes **preservam** `categoryId`.

**Histórico gerado:** Nenhum.

---

## 5. Payee Services

### CreatePayee

**Objetivo:** Criar favorecido para vínculo opcional em registros.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `name` | sim | Nome exibido |
| `notes` | não | Observações |

**Validações:**

- `name` não vazio (após trim).

**Efeitos colaterais:**

- Persiste `Payee` com `isArchived = false`, `deletedAt = null`, timestamps.
- Disponível imediatamente para uso em `CreateRecord` e `CreatePayeeQuick`.

**Histórico gerado:** Nenhum.

---

### UpdatePayee

**Objetivo:** Alterar dados do favorecido.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `payeeId` | sim | Favorecido alvo |
| `name` | não | Novo nome |
| `notes` | não | Novas observações |

**Validações:**

- Favorecido existe, `deletedAt IS NULL`.
- Pelo menos um campo editável informado.
- `name` não vazio se informado.

**Efeitos colaterais:**

- Atualiza campos e `updatedAt`.
- Registros vinculados mantêm `payeeId`.

**Histórico gerado:** Nenhum.

---

### ArchivePayee

**Objetivo:** Arquivar favorecido — ocultar em seleções operacionais.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `payeeId` | sim | Favorecido a arquivar |

**Validações:**

- Favorecido existe, `deletedAt IS NULL`, `isArchived = false`.

**Efeitos colaterais:**

- Define `isArchived = true` e atualiza `updatedAt`.
- Registros existentes **preservam** `payeeId`.

**Histórico gerado:** Nenhum.

---

### CreatePayeeDocument

**Objetivo:** Adicionar documento de referência a um favorecido.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `payeeId` | sim | Favorecido vinculado |
| `type` | sim | Ex.: `CPF`, `CNPJ`, `RG` |
| `value` | sim | Valor informado |

**Validações:**

- Favorecido existe, `deletedAt IS NULL`.
- `type` e `value` não vazios (após trim).
- **Sem** validação de formato (CPF, CNPJ, etc.).

**Efeitos colaterais:**

- Persiste `PayeeDocument` com `createdAt`.
- Quantidade ilimitada por favorecido.

**Histórico gerado:** Nenhum.

---

### RemovePayeeDocument

**Objetivo:** Remover documento de favorecido.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `documentId` | sim | Documento a remover |

**Validações:**

- Documento existe e pertence a favorecido não excluído logicamente.

**Efeitos colaterais:**

- **Remoção física** do registro `PayeeDocument` (V1 — sem soft delete).

**Histórico gerado:** Nenhum.

---

### CreatePayeePaymentMethod

**Objetivo:** Adicionar forma de pagamento de referência ao favorecido.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `payeeId` | sim | Favorecido vinculado |
| `type` | sim | Ex.: `PIX`, `banco` |
| `value` | sim | Valor informado |

**Validações:**

- Favorecido existe, `deletedAt IS NULL`.
- `type` e `value` não vazios (após trim).
- **Sem** validação de formato.
- Apenas referência cadastral — **não** vincula automaticamente à efetivação de registros.

**Efeitos colaterais:**

- Persiste `PayeePaymentMethod` com `createdAt`.

**Histórico gerado:** Nenhum.

---

### RemovePayeePaymentMethod

**Objetivo:** Remover forma de pagamento de referência.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `paymentMethodId` | sim | Forma de pagamento a remover |

**Validações:**

- Registro existe e pertence a favorecido não excluído logicamente.

**Efeitos colaterais:**

- **Remoção física** do registro `PayeePaymentMethod` (V1).

**Histórico gerado:** Nenhum.

---

## 6. FinancialRecord Services

### CreateRecord

**Objetivo:** Criar registro financeiro avulso (conta a pagar ou a receber), sem transferência nem recorrência.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `walletId` | sim | Carteira proprietária |
| `type` | sim | `payable` \| `receivable` |
| `description` | sim | Descrição principal |
| `categoryId` | sim | Categoria |
| `dueDate` | sim | Vencimento / previsão |
| `expectedAmount` | sim | Valor previsto (centavos) |
| `payeeId` | não | Favorecido — **opcional** |
| `recordNote` | não | Observação do registro |
| `alertEnabled` | não | Default conforme settings |
| `alertOffset` | não | Dias de antecedência |

**Validações:**

- Carteira existe, `deletedAt IS NULL`, `isArchived = false`.
- Categoria existe, `deletedAt IS NULL` (pode estar arquivada — política: permitir apenas categorias ativas em criação).
- Se `payeeId` informado: favorecido existe, `deletedAt IS NULL`.
- `type` ∈ {`payable`, `receivable`}.
- `description` não vazio.
- `expectedAmount` inteiro ≥ 0.
- `dueDate` válida.
- Registro criado com `storedStatus = pending`.
- Campos de efetivação (`effectiveDate`, `effectiveAmount`, `paymentNote`) permanecem nulos.
- **Sem** `transferGroupId`, **sem** `recurrenceGroupId` (usar serviços dedicados).

**Efeitos colaterais:**

- Persiste `FinancialRecord` com timestamps e `deletedAt = null`.

**Histórico gerado:**

| Evento | Descrição |
|---|---|
| `record_created` | Registro criado |

---

### UpdateRecord

**Objetivo:** Alterar registro financeiro avulso (não vinculado a transferência).

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `recordId` | sim | Registro alvo |
| `description` | não | Nova descrição |
| `categoryId` | não | Nova categoria |
| `dueDate` | não | Nova data |
| `expectedAmount` | não | Novo valor previsto (centavos) |
| `payeeId` | não | Novo favorecido ou `null` para remover |
| `recordNote` | não | Nova observação |
| `alertEnabled` | não | Participação em alertas |
| `alertOffset` | não | Antecedência |

**Validações:**

- Registro existe, `deletedAt IS NULL`.
- Registro **não** possui `transferGroupId` — registros de transferência usam `UpdateTransfer`.
- Registro com `storedStatus = completed`: campos de efetivação **não** são alterados por este serviço (usar `RevertPayment` antes, se necessário).
- Validações de FK e valores equivalentes ao `CreateRecord` para campos informados.
- `payeeId = null` remove vínculo (permitido).

**Efeitos colaterais:**

- Atualiza campos informados e `updatedAt`.
- Não altera `storedStatus` nem campos de efetivação.

**Histórico gerado:**

| Evento | Descrição |
|---|---|
| `record_updated` | Registro alterado — `metadata` pode conter diff dos campos |

---

### DeleteRecord

**Objetivo:** Excluir logicamente um registro financeiro.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `recordId` | sim | Registro a excluir |

**Validações:**

- Registro existe, `deletedAt IS NULL`.
- Se possui `transferGroupId`: **não** excluir isoladamente — exigir fluxo de transferência (exclusão sincronizada do par) ou regra explícita futura. V1: rejeitar delete isolado de registro em par de transferência.

**Efeitos colaterais:**

- Define `deletedAt = now` e atualiza `updatedAt`.
- Anexos ativos do registro podem ser soft-deleted em cascata lógica (política de implementação) ou permanecer referenciando registro excluído — consultas operacionais ignoram ambos.

**Histórico gerado:** Nenhum (exclusão lógica não gera evento append-only na V1 documentada).

---

### RestoreRecord

**Objetivo:** Restaurar registro financeiro excluído logicamente.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `recordId` | sim | Registro a restaurar |

**Validações:**

- Registro existe, `deletedAt IS NOT NULL`.
- Carteira, categoria e favorecido (se houver) ainda existem ou permanecem referenciáveis.

**Efeitos colaterais:**

- Limpa `deletedAt` e atualiza `updatedAt`.

**Histórico gerado:** Nenhum.

---

## 7. Payment Services

> Pagamento e recebimento **não** são entidades. Estes serviços efetivam ou revertem um `FinancialRecord`.

### RegisterPayment

**Objetivo:** Efetivar registro — marcar como pago (`payable`) ou recebido (`receivable`).

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `recordId` | sim | Registro a efetivar |
| `effectiveAmount` | sim | Valor efetivado (centavos) |
| `effectiveDate` | sim | Data da efetivação |
| `paymentNote` | não | Observação da efetivação |

**Validações:**

- Registro existe, `deletedAt IS NULL`.
- `storedStatus = pending`.
- Registro **não** faz parte de par de transferência (`transferGroupId` nulo) — transferências têm fluxo próprio.
- `effectiveAmount` inteiro ≥ 0.
- `effectiveDate` válida.

**Efeitos colaterais:**

- Define `effectiveAmount`, `effectiveDate`, `paymentNote` (se informado).
- Define `storedStatus = completed`.
- Atualiza `updatedAt`.

**Histórico gerado:**

| Evento | Descrição |
|---|---|
| `payment_registered` | Pagamento/recebimento registrado |

---

### RevertPayment

**Objetivo:** Reverter efetivação — retornar registro ao estado pendente.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `recordId` | sim | Registro a reverter |

**Validações:**

- Registro existe, `deletedAt IS NULL`.
- `storedStatus = completed`.
- Registro **não** faz parte de par de transferência.

**Efeitos colaterais:**

- Limpa `effectiveAmount`, `effectiveDate`, `paymentNote`.
- Define `storedStatus = pending`.
- Atualiza `updatedAt`.

**Histórico gerado:**

| Evento | Descrição |
|---|---|
| `payment_reverted` | Efetivação revertida |

---

## 8. Transfer Services

> Transferência = **dois registros** + **um `TransferLink`**. `transferGroupId` em cada registro referencia `TransferLink.id`.

### CreateTransfer

**Objetivo:** Criar transferência entre duas carteiras distintas — persiste **1 `TransferLink`** + **2 `FinancialRecord`**.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `sourceWalletId` | sim | Carteira origem |
| `targetWalletId` | sim | Carteira destino |
| `sourceType` | sim | `payable` ou `receivable` na origem |
| `description` | sim | Descrição compartilhada (ou par de descrições — ver nota) |
| `categoryId` | sim | Categoria (aplicada a ambos ou por registro — ver nota) |
| `dueDate` | sim | Data compartilhada |
| `expectedAmount` | sim | Valor (centavos) — mesmo valor em ambos |
| `payeeId` | não | Favorecido opcional |
| `recordNote` | não | Observação opcional |

**Nota:** A implementação pode aceitar descrição/categoria distintas por lado; na V1 mínima, campos compartilhados são sincronizados.

**Validações:**

- `sourceWalletId ≠ targetWalletId`.
- Ambas carteiras existem, ativas (`deletedAt IS NULL`, `isArchived = false`).
- `sourceType` ∈ {`payable`, `receivable`}; tipo do registro destino é o **oposto**.
- Categoria e favorecido (se informado) válidos.
- `expectedAmount` inteiro ≥ 0.
- `dueDate` válida.

**Efeitos colaterais:**

- Cria **registro origem** (`sourceWalletId`, `sourceType`) com `storedStatus = pending`, sem efetivação.
- Cria **registro destino** (`targetWalletId`, tipo **oposto**) com metadados sincronizáveis.
- Cria **`TransferLink`** com `sourceRecordId`, `targetRecordId`, `createdAt`.
- Define `transferGroupId = TransferLink.id` em **ambos** os registros.

**Exemplo:** transferir R$ 500,00 da Carteira Pessoal → Carteira Investimentos em 15/06/2026:

| Carteira Pessoal | Carteira Investimentos |
|---|---|
| `payable`, `expectedAmount: 50000` | `receivable`, `expectedAmount: 50000` |
| `transferGroupId → TransferLink.id` | `transferGroupId → TransferLink.id` |

**Histórico gerado:**

| Evento | Registro | Descrição |
|---|---|---|
| `transfer_created` | origem | Transferência criada |
| `transfer_created` | destino | Transferência criada |

> Opcionalmente pode registrar também `record_created` em cada registro; na V1 o evento semântico preferido para transferência é `transfer_created`.

---

### UpdateTransfer

**Objetivo:** Alterar dados sincronizáveis de uma transferência existente.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `transferLinkId` | sim | Vínculo da transferência |
| `description` | não | Nova descrição |
| `categoryId` | não | Nova categoria |
| `dueDate` | não | Nova data |
| `expectedAmount` | não | Novo valor (centavos) |
| `payeeId` | não | Favorecido ou `null` |
| `recordNote` | não | Nova observação |

**Validações:**

- `TransferLink` existe; ambos registros existem, `deletedAt IS NULL`.
- Ambos possuem `transferGroupId = transferLinkId`.
- Campos de efetivação **não** alterados por este serviço.
- Validações equivalentes ao create para campos informados.

**Efeitos colaterais:**

- Atualiza campos informados em **ambos** os registros do par.
- Atualiza `updatedAt` nos dois registros.

**Histórico gerado:**

| Evento | Registro | Descrição |
|---|---|---|
| `transfer_updated` | origem | Transferência alterada |
| `transfer_updated` | destino | Transferência alterada |

---

## 9. Recurrence Services

### CreateRecurringRecords

**Objetivo:** Criar lote de registros recorrentes via assistente — **uma única vez**, no cadastro.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `walletId` | sim | Carteira |
| `type` | sim | `payable` \| `receivable` |
| `description` | sim | Descrição base |
| `categoryId` | sim | Categoria |
| `payeeId` | não | Favorecido opcional |
| `expectedAmount` | sim | Valor por ocorrência (centavos) |
| `recordNote` | não | Observação base |
| `alertEnabled` | não | Default de alerta |
| `alertOffset` | não | Antecedência |
| `ruleDescription` | sim | Texto legível da regra consumida |
| `occurrences` | sim | Lista de `{ dueDate, recurrenceIndex }` — datas e índices gerados pelo assistente |

**Validações:**

- Carteira, categoria e favorecido (se houver) válidos.
- `occurrences` não vazia; cada `dueDate` válida; `recurrenceIndex` único e sequencial (1…N).
- `expectedAmount` inteiro ≥ 0 por ocorrência.
- Regra **consumida na criação** — não persiste regra viva.

**Efeitos colaterais:**

- Cria `RecurrenceBatch` com `id`, `ruleDescription`, `startDate`, `endDate` (se aplicável), `occurrenceCount`, `createdAt`.
- Para cada ocorrência: cria `FinancialRecord` independente com `recurrenceGroupId = RecurrenceBatch.id`, `recurrenceIndex`, `storedStatus = pending`, sem transferência.
- Registros **não** são vinculados entre si além do metadado de lote.

**Histórico gerado:**

| Evento | Descrição |
|---|---|
| `record_created` | Um evento por registro criado (N eventos) |

---

## 10. Attachment Services

### AddAttachment

**Objetivo:** Anexar arquivo local a um registro financeiro.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `recordId` | sim | Registro vinculado |
| `kind` | sim | `document` \| `receipt` |
| `filename` | sim | Nome original |
| `mimeType` | sim | MIME type |
| `size` | sim | Tamanho em bytes |
| `localPath` | sim | Caminho no filesystem do app |
| `label` | não | Rótulo descritivo |

**Validações:**

- Registro existe, `deletedAt IS NULL`.
- `kind` ∈ {`document`, `receipt`}.
- `filename`, `mimeType`, `localPath` não vazios.
- `size` ≥ 0.
- Arquivo em `localPath` acessível (validação de filesystem na implementação).
- Evitar duplicata de anexo ativo com mesmo `localPath` no registro.

**Efeitos colaterais:**

- Persiste `Attachment` com `deletedAt = null`, `createdAt`.
- Arquivo físico já deve estar no storage do app antes ou durante a operação.

**Histórico gerado:**

| Evento | Descrição |
|---|---|
| `attachment_added` | Anexo adicionado — `metadata` pode incluir `kind`, `filename` |

---

### RemoveAttachment

**Objetivo:** Remover anexo de um registro (exclusão lógica).

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `attachmentId` | sim | Anexo a remover |

**Validações:**

- Anexo existe, `deletedAt IS NULL`.
- Registro pai existe (mesmo que excluído — política: permitir remoção de anexo órfão).

**Efeitos colaterais:**

- Define `deletedAt = now` no `Attachment`.
- Remoção do arquivo físico em `localPath` é responsabilidade da camada de storage (pode ser imediata ou lazy).

**Histórico gerado:**

| Evento | Descrição |
|---|---|
| `attachment_removed` | Anexo removido — `metadata` pode incluir `kind`, `filename` |

---

## 11. SavedFilter Services

> Filtros salvos serializam `HomeFiltersState`. **Não** incluem carteira ativa.

### SaveFilter

**Objetivo:** Salvar combinação atual de filtros da Home para reutilização.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `name` | sim | Nome definido pelo usuário |
| `filters` | sim | Objeto equivalente a `HomeFiltersState` |

**Validações:**

- `name` não vazio (após trim).
- `filters` válido conforme contrato V1:
  - `type`, `status`, `documentState`, `receiptState`, `recurringState` com enums permitidos.
  - `minValue` / `maxValue`: inteiros em centavos ou `null`.
  - Se ambos presentes: `minValue ≤ maxValue`.
  - `categoryId` / `payeeId`: `null` ou ID existente.
  - Datas ISO válidas ou `null`.
- **Sem** campo de carteira no JSON.

**Efeitos colaterais:**

- Persiste `SavedFilter` com `filtersJson` serializado, timestamps.

**Histórico gerado:** Nenhum.

---

### UpdateSavedFilter

**Objetivo:** Alterar nome e/ou filtros de um filtro salvo.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `savedFilterId` | sim | Filtro alvo |
| `name` | não | Novo nome |
| `filters` | não | Novo `HomeFiltersState` |

**Validações:**

- Filtro salvo existe.
- Pelo menos um campo editável informado.
- Mesmas validações de `SaveFilter` para campos informados.

**Efeitos colaterais:**

- Atualiza campos e `updatedAt`.

**Histórico gerado:** Nenhum.

---

### DeleteSavedFilter

**Objetivo:** Excluir filtro salvo.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `savedFilterId` | sim | Filtro a excluir |

**Validações:**

- Filtro salvo existe.

**Efeitos colaterais:**

- **Remoção física** do `SavedFilter` (sem soft delete na V1).

**Histórico gerado:** Nenhum.

---

## 12. Criação rápida (UX)

Atalhos de interface durante cadastro de registro. **Não** são entidades, tabelas ou serviços de persistência independentes.

| Atalho UX | Delega para |
|---|---|
| `CreateCategoryQuick` | `CreateCategory` |
| `CreatePayeeQuick` | `CreatePayee` |

### CreateCategoryQuick

**Objetivo:** Permitir criar categoria inline enquanto o usuário cadastra um registro.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `name` | sim | Nome digitado pelo usuário |

**Validações:**

- `name` não vazio (após trim).
- Mesmas regras de unicidade/nome do `CreateCategory` quando aplicável.

**Comportamento:**

- Invoca `CreateCategory` com `name` + **`icon` e `color` padrão temporários** (defaults da aplicação).
- Retorna `categoryId` para **seleção imediata** no formulário do registro em edição.

**Efeitos colaterais:** idênticos ao `CreateCategory` — persiste em `Category`.

**Histórico gerado:** Nenhum.

---

### CreatePayeeQuick

**Objetivo:** Permitir criar favorecido inline enquanto o usuário cadastra um registro.

**Entradas:**

| Campo | Obrigatório | Descrição |
|---|---|---|
| `name` | sim | Nome digitado pelo usuário |

**Validações:**

- `name` não vazio (após trim).

**Comportamento:**

- Invoca `CreatePayee` com apenas `name`.
- Retorna `payeeId` para **seleção imediata** no formulário do registro em edição.

**Efeitos colaterais:** idênticos ao `CreatePayee` — persiste em `Payee`.

**Histórico gerado:** Nenhum.

---

## 13. O que não existe como serviço na V1

| Item | Motivo |
|---|---|
| **AlertService** / CRUD de alertas | Alertas derivados em runtime; sem tabela |
| **PaymentRepository** / entidade Payment | Efetivação via `RegisterPayment` |
| **RecurrenceRule** viva | Lote único via `CreateRecurringRecords` |
| **Scheduler / jobs** | Offline first |
| **Sync V1 (arquivos)** | Suspenso — ver [sync-v1.md](./sync-v1.md) |
| **Remote API adapter** | Etapa futura — backend centralizado |
| **DeleteWallet / DeleteCategory / DeletePayee** | V1 documenta arquivamento; exclusão lógica via `deletedAt` pode ser serviço futuro |
| **Edição em lote de recorrências** | Fora do escopo V1 |
| **Edição em lote de transferências** | Fora do escopo V1 |
| **Geração automática futura de recorrências** | Sem scheduler ou regra viva |
| **Notificações nativas** | V2 |
| **Execução em background** | Offline first |
| **DeleteTransfer** | Fluxo dedicado futuro (exclusão sincronizada do par) |

---

## Referências cruzadas

| Documento | Relação |
|---|---|
| [modelo-conceitual-v1.md](./modelo-conceitual-v1.md) | Domínio e regras de negócio |
| [sqlite-schema-v1.md](./sqlite-schema-v1.md) | Entidades, FKs e integridade |
| [arquitetura-home-widgets.md](./arquitetura-home-widgets.md) | Home, filtros e contexto operacional |
| [TECNICO.md](./TECNICO.md) | Setup, persistência e build |

---

*Use cases implementados em `src/features/*/application/`; persistência via ports em `src/features/persistence/`.*
