# Sync V1 — Fluxor

> Estratégia conceitual de sincronização registrada **antes** de qualquer implementação.
> Referências: [modelo-conceitual-v1.md](./modelo-conceitual-v1.md) · [sqlite-schema-v1.md](./sqlite-schema-v1.md) · [application-services-v1.md](./application-services-v1.md)

**Versão:** 1 · **Última atualização:** junho/2026

---

# Status: Suspenso

> Documento mantido apenas como referência histórica. A estratégia de sincronização entre bancos SQLite **não** é mais a direção do projeto.

A estratégia atual do Fluxor é:

```text
Provider Local (SQLite)
ou
Provider Remoto (Remote API Adapter)
```

O usuário escolhe **um** modo de persistência no Setup Inicial. Não há sincronização bidirecional entre SQLite local e MariaDB remoto — são fontes de dados alternativas, não complementares.

---

# Status (histórico)

⚠️ A estratégia descrita neste documento não é mais a direção atual do projeto.

A sincronização baseada em SQLite foi suspensa.

Motivos:

- complexidade de sincronização entre dispositivos;
- resolução de conflitos;
- suporte ao ambiente Web;
- custo de manutenção.

Nova direção:

- Persistence Provider
- Persistence Ports
- Adapter SQLite **ou** Adapter Remote API (escolha exclusiva)
- Backend centralizado (modo Remoto)
- **Sem** sincronização entre bancos locais e remotos

O restante deste documento permanece apenas como referência histórica.

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Princípios](#2-princípios)
3. [Fonte operacional vs remoto](#3-fonte-operacional-vs-remoto)
4. [Arquivos sincronizados](#4-arquivos-sincronizados)
5. [Fluxo manual](#5-fluxo-manual)
6. [Detecção de divergência](#6-detecção-de-divergência)
7. [Conflitos e resolução](#7-conflitos-e-resolução)
8. [Manifesto — `sync-manifest.json`](#8-manifesto--sync-manifestjson)
9. [Configurações e UX](#9-configurações-e-ux)
10. [Fora do escopo V1](#10-fora-do-escopo-v1)
11. [Referências cruzadas](#11-referências-cruzadas)

---

## 1. Visão geral

O **Sync V1** do Fluxor é um mecanismo **opcional** de **backup, restauração e transporte** de dados entre dispositivos. O app permanece **offline first** — funciona integralmente sem sync e sem conexão.

```
┌─────────────────────────────────────────────────────────────┐
│                      Dispositivo A ou B                      │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │ SQLite local    │    │ Arquivos locais (anexos)      │   │
│  │ database.sqlite │    │ documentos · comprovantes     │   │
│  │ (fonte oper.)   │    │ (fonte operacional)           │   │
│  └────────┬────────┘    └──────────────┬───────────────┘   │
│           │         Sync manual         │                   │
│           └──────────────┬──────────────┘                   │
└──────────────────────────┼──────────────────────────────────┘
                           │ push / pull
                           ▼
              ┌────────────────────────────┐
              │  Armazenamento remoto       │
              │  (Drive / Dropbox / etc.) │
              │  backup · restauração ·   │
              │  transporte entre devices │
              └────────────────────────────┘
```

**Não existe servidor central.** **Não existe API de registros.** O remoto é apenas um **container de arquivos** escolhido pelo usuário.

---

## 2. Princípios

| Princípio | Descrição |
|---|---|
| **Sync opcional** | O app funciona sem sync configurado ou conectado. |
| **Offline first** | Toda operação diária usa dados locais; sync não bloqueia uso. |
| **SQLite local = fonte operacional** | Leitura e escrita do domínio ocorrem no banco local. |
| **Arquivos locais = fonte operacional** | Anexos (`document`, `receipt`) vivem no filesystem do app. |
| **Remoto = backup e transporte** | Drive (ou equivalente) guarda cópia para restauração ou uso em outro dispositivo. |
| **Sync manual** | Usuário inicia envio ou recebimento explicitamente. |
| **Substituição, não merge** | Conflitos resolvem-se por escolha do usuário — cópia local **ou** remota vence por inteiro. |
| **Sem colaboração** | V1 não suporta edição concorrente em múltiplos dispositivos. |

---

## 3. Fonte operacional vs remoto

| Aspecto | Local (operacional) | Remoto (backup/transporte) |
|---|---|---|
| **Papel** | Fonte da verdade durante o uso | Cópia para backup e troca de dispositivo |
| **SQLite** | `database.sqlite` ativo do app | Cópia do arquivo completo |
| **Anexos** | Paths em `Attachment.localPath` | Cópia dos arquivos binários |
| **Metadados de sync** | Estado conhecido pelo app | `sync-manifest.json` no remoto |
| **Servidor central** | — | **Não existe** |
| **API de registros** | — | **Não existe** |
| **Merge por entidade** | — | **Não existe** |

O schema SQLite ([sqlite-schema-v1.md](./sqlite-schema-v1.md)) **não** inclui colunas de sync na V1 — metadados de comparação ficam no manifesto e na camada de sync, fora das tabelas de domínio.

---

## 4. Arquivos sincronizados

Conjunto fechado de artefatos transportados entre local e remoto:

| Artefato | Descrição |
|---|---|
| **`database.sqlite`** | Banco SQLite completo — todo o domínio persistido |
| **Anexos de documentos** | Arquivos referenciados por `Attachment` com `kind = document` |
| **Anexos de comprovantes** | Arquivos referenciados por `Attachment` com `kind = receipt` |
| **`sync-manifest.json`** | Metadados para comparação e rastreabilidade do sync |

### Estrutura conceitual no remoto

```
fluxor-sync/                    (pasta raiz no provedor — nome configurável)
├── database.sqlite
├── sync-manifest.json
└── attachments/
    ├── documents/
    │   └── …
    └── receipts/
        └── …
```

> Nomes de pastas e layout exato serão definidos na implementação. Este documento registra apenas a **intenção conceitual**.

### Coerência banco ↔ anexos

- O banco referencia anexos via `Attachment.localPath` (paths locais).
- No sync, anexos são copiados preservando identificação suficiente para reconstruir paths locais válidos após pull.
- **Pull** substitui banco e anexos **juntos** — evitar estado onde o banco referencia arquivos ausentes.

---

## 5. Fluxo manual

Sync é **sempre iniciado pelo usuário** na área **Configurações → Armazenamento e Sync** (ver [§9](#9-configurações-e-ux)).

### Operações

| Operação | Nome UX (conceitual) | Efeito |
|---|---|---|
| **Pull** | Puxar / Usar remoto | Substitui local pelo conteúdo remoto |
| **Push** | Enviar / Sobrescrever remoto | Substitui remoto pelo conteúdo local |

### Fluxo recomendado entre dispositivos

```
Dispositivo A (trabalhou)                Dispositivo B (vai usar)
─────────────────────────                ─────────────────────────
1. Trabalho offline normal               1. Antes de usar: PULL
2. Ao terminar: PUSH                     2. Trabalho offline normal
                                         3. Ao terminar: PUSH
```

**Regra explícita:**

- **Antes de usar em outro dispositivo**, o usuário **deve puxar** a versão remota (pull).
- **Depois de trabalhar**, o usuário **deve enviar** a versão local (push).

O sistema **pode avisar** quando detectar que local e remoto divergem (ver [§6](#6-detecção-de-divergência)) — mas não sincroniza automaticamente.

### Sequência conceitual — Push

1. Usuário solicita envio.
2. App valida que não há operação de sync em andamento.
3. App calcula/atualiza metadados locais (hashes, timestamps).
4. App compara com `sync-manifest.json` remoto (se existir).
5. Se divergência detectada → fluxo de conflito ([§7](#7-conflitos-e-resolução)).
6. Se sem conflito ou usuário escolheu manter local → upload de `database.sqlite`, anexos e `sync-manifest.json`.
7. Confirmação ao usuário.

### Sequência conceitual — Pull

1. Usuário solicita recebimento.
2. App baixa `sync-manifest.json` remoto (se existir).
3. App compara com estado local.
4. Se divergência detectada → fluxo de conflito.
5. Se sem conflito ou usuário escolheu usar remoto → substitui `database.sqlite` local, anexos locais e atualiza referências internas.
6. App reinicializa ou recarrega camada de dados (implementação futura).
7. Confirmação ao usuário.

---

## 6. Detecção de divergência

O app detecta divergência comparando **metadados** — principalmente via `sync-manifest.json` e hashes — sem analisar registro a registro.

| Sinal | Indício |
|---|---|
| Hash do banco local ≠ hash remoto | Dados financeiros diferentes |
| Timestamp local ≠ remoto | Alterações em lados distintos |
| Lista/hash de anexos diferente | Arquivos de documento ou comprovante desalinhados |
| Manifesto ausente no remoto | Primeiro sync ou remoto limpo |
| Manifesto ausente localmente | Dispositivo nunca sincronizou |

Quando divergência é detectada **antes** de push ou pull, o app **avisa o usuário** e direciona para resolução manual ([§7](#7-conflitos-e-resolução)).

> Detecção é **best-effort** na V1 — suficiente para evitar sobrescrita silenciosa, não para reconciliar conteúdo.

---

## 7. Conflitos e resolução

### O que NÃO existe na V1

| Item | Status |
|---|---|
| Resolução automática de conflito | **Não** |
| Merge de dados | **Não** |
| Merge por entidade ou registro | **Não** |
| CRDT | **Não** |
| Edição concorrente suportada | **Não** |
| Resolução campo a campo | **Não** |

### Modelo de conflito

Conflito ocorre quando **local e remoto divergem** e o usuário tenta push ou pull. Não há estado intermediário — apenas duas cópias completas do conjunto sincronizado.

### Resolução — escolha do usuário

| Opção | Ação | Resultado |
|---|---|---|
| **Manter local** | Push forçado | Remoto substituído pela cópia local |
| **Usar remoto** | Pull forçado | Local substituído pela cópia remota |

Não há terceira opção na V1 (ex.: mesclar categorias de A com registros de B).

### UX conceitual do diálogo de conflito

```
Local e remoto estão diferentes.

Última alteração local:  06/06/2026 14:30
Último sync remoto:      05/06/2026 09:15

[ Manter local e sobrescrever remoto ]
[ Usar remoto e substituir local      ]
[ Cancelar                            ]
```

Após a escolha, a operação prossegue como push ou pull **completo** do pacote (banco + anexos + manifesto).

---

## 8. Manifesto — `sync-manifest.json`

Arquivo JSON no remoto (e espelho local opcional) com metadados para **comparação** — não substitui o banco.

### Campos previstos

| Campo | Tipo | Descrição |
|---|---|---|
| `schemaVersion` | string | Versão do schema SQLite (ex.: `1`) — alinhado a [sqlite-schema-v1.md](./sqlite-schema-v1.md) |
| `databaseHash` | string | Hash do arquivo `database.sqlite` |
| `databaseLastModifiedAt` | datetime (ISO 8601) | Data da última alteração local conhecida do banco |
| `attachments` | array | Lista de arquivos anexos sincronizados |
| `attachments[].path` | string | Caminho relativo no pacote de sync |
| `attachments[].kind` | string | `document` \| `receipt` |
| `attachments[].hash` | string | Hash do arquivo |
| `attachments[].size` | integer | Tamanho em bytes |
| `deviceId` | string | Identificador estável do dispositivo que produziu este manifesto |
| `lastSyncAt` | datetime (ISO 8601) | Timestamp do último sync bem-sucedido |
| `manifestVersion` | integer | Versão do formato do manifesto (evolução futura) |

### Exemplo conceitual (ilustrativo)

```json
{
  "manifestVersion": 1,
  "schemaVersion": "1",
  "databaseHash": "sha256:…",
  "databaseLastModifiedAt": "2026-06-06T14:30:00Z",
  "attachments": [
    {
      "path": "attachments/documents/boleto-jun.pdf",
      "kind": "document",
      "hash": "sha256:…",
      "size": 245760
    }
  ],
  "deviceId": "device-uuid-…",
  "lastSyncAt": "2026-06-06T14:35:00Z"
}
```

> Exemplo apenas para comunicação da ideia — formato final na implementação.

### Regras do manifesto

- Atualizado a cada sync **bem-sucedido** (push).
- Usado no pull para decidir se há divergência **antes** de substituir arquivos.
- **Não** contém registros financeiros — apenas metadados e hashes.
- Algoritmo de hash (ex.: SHA-256) será definido na implementação.

---

## 9. Configurações e UX

Sync é acessado em **Configurações → Armazenamento e Sync** (índice administrativo descrito em [modelo-conceitual-v1.md](./modelo-conceitual-v1.md) §14).

### Área prevista (conceitual)

| Elemento | Descrição |
|---|---|
| **Status do sync** | Último sync, destino remoto configurado ou não |
| **Conectar provedor** | Vincular pasta remota (implementação futura — sem integração neste documento) |
| **Puxar remoto** | Pull manual |
| **Enviar local** | Push manual |
| **Aviso de divergência** | Banner ou modal quando local ≠ remoto |
| **Identificador do dispositivo** | Exibição opcional do `deviceId` |

### Comportamento offline

- Sem conexão ou sem provedor configurado: app continua operando normalmente.
- Ações de sync ficam desabilitadas ou informam indisponibilidade — **sem** fila automática na V1.

---

## 10. Fora do escopo V1

| Item | Motivo |
|---|---|
| **Merge automático** | V1 = substituição integral |
| **Sync em background** | Sync manual apenas |
| **Sync contínuo** | Sem observação de pasta ou webhook |
| **Colaboração multiusuário** | Um usuário, dispositivos sequenciais |
| **Resolução campo a campo** | Sem merge parcial |
| **Servidor central** | Arquitetura peer-to-cloud-storage |
| **API remota de registros** | Sem REST/GraphQL de domínio |
| **Integração Drive/Dropbox/OneDrive** | Documentação de estratégia apenas; implementação futura |
| **CRDT / OT** | Sem edição concorrente |
| **Metadados de sync no schema SQLite** | Manifesto externo; schema de domínio inalterado |
| **Criptografia de pacote** | Pode ser avaliada em versão futura |
| **Versionamento incremental / delta sync** | V1 transporta pacote completo |

---

## 11. Referências cruzadas

| Documento | Relação |
|---|---|
| [modelo-conceitual-v1.md](./modelo-conceitual-v1.md) | Domínio, anexos locais, Settings |
| [sqlite-schema-v1.md](./sqlite-schema-v1.md) | `database.sqlite`, `Attachment`, versão do schema |
| [application-services-v1.md](./application-services-v1.md) | Serviços de domínio — sync não altera regras de negócio |
| [TECNICO.md](./TECNICO.md) | Stack e execução |

---

*Próximo passo: implementar camada de sync e integração com provedor escolhido — fora do escopo deste documento.*
