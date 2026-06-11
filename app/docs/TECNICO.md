# Fluxor — Documentação Técnica

> Documento de referência para desenvolvimento, compilação e manutenção do **Fluxor**.
> Mantenha este arquivo atualizado a cada mudança relevante de stack, estrutura ou fluxo de trabalho.

---

## Índice

1. [Visão geral](#visão-geral)
2. [Stack tecnológica](#stack-tecnológica)
3. [Pré-requisitos](#pré-requisitos)
4. [Setup inicial](#setup-inicial)
5. [Comandos de desenvolvimento](#comandos-de-desenvolvimento)
6. [Modos de execução](#modos-de-execução)
7. [Build e distribuição](#build-e-distribuição)
   - [App desktop](#app-desktop-instalável)
   - [Android (APK)](#android-apk)
8. [Arquitetura do projeto](#arquitetura-do-projeto)
9. [Persistência](#persistência)
10. [Convenções de código](#convenções-de-código)
11. [Frontend (React)](#frontend-react)
12. [Backend (Tauri / Rust)](#backend-tauri--rust)
13. [SQLite](#sqlite)
14. [Configuração e variáveis](#configuração-e-variáveis)
15. [Solução de problemas](#solução-de-problemas)
16. [Roadmap técnico](#roadmap-técnico)

---

## Visão geral

**Fluxor** é um aplicativo **offline first** para gestão de contas a pagar e receber. O foco é operação diária com baixa fricção, persistência desacoplada (SQLite local ou API remota) e widgets modulares na Home.

| Item | Valor |
|---|---|
| Nome do pacote | `fluxor` |
| Versão atual | `0.1.0` |
| Identificador Tauri | `com.fluxor.app` |
| Porta de desenvolvimento | `5173` |
| Banco local | `fluxor.db` (SQLite via `tauri-plugin-sql`, modo Local) |
| Config de persistência | `localStorage` — chave `fluxor:persistence-config` |
| Estágio atual | Home (SQLite ou API remota + widgets) · Setup de persistência · Exportação CSV/PDF · Configurações · Remote Persistence MVP |
| Plataformas alvo | Desktop (Linux/macOS/Windows) · Android (build via Tauri 2) · Web (modo remoto) |

---

## Stack tecnológica

| Camada | Tecnologia | Versão (aprox.) |
|---|---|---|
| UI | React | 19 |
| Linguagem | TypeScript | 5.8 |
| Bundler | Vite | 6 |
| Desktop | Tauri | 2 |
| Mobile | Tauri 2 (Android) | 2 |
| Estilos | Tailwind CSS | 4 |
| Roteamento | React Router | 7 |
| Banco | SQLite via `tauri-plugin-sql` | 2.x |
| Backend nativo | Rust | 2021 edition |

### Separação frontend / backend

```
┌─────────────────────────────────────┐
│  src/          (React + TypeScript) │  ← Interface, rotas, serviços
├─────────────────────────────────────┤
│  src-tauri/    (Rust + Tauri 2)     │  ← Janela nativa, plugins, SQLite
└─────────────────────────────────────┘
         ↕  IPC (Tauri invoke / events)
```

O frontend roda no WebView do Tauri. Em desenvolvimento, o Vite serve os assets em `http://localhost:5173` e o Tauri carrega essa URL.

---

## Pré-requisitos

### Obrigatório — frontend

| Ferramenta | Versão mínima |
|---|---|
| **Node.js** | 20+ |
| **npm** | 9+ (ou compatível) |

### Obrigatório — app desktop (`make app`)

| Ferramenta | Observação |
|---|---|
| **Rust** (stable) | Instalado via `rustup` — ver [Setup inicial](#setup-inicial) |
| **Dependências de SO** | GTK/WebKit e ferramentas de build — ver [Setup inicial](#setup-inicial) |

### Linux (Debian/Ubuntu)

O Tauri precisa de bibliotecas de desenvolvimento do sistema. O `Makefile` instala automaticamente via `make install-tauri-deps` (requer `sudo`):

| Pacote | Função |
|---|---|
| `pkg-config` | Localiza libs nativas na compilação Rust (ex.: `glib-2.0`) |
| `libwebkit2gtk-4.1-dev` | WebView do Tauri |
| `build-essential` | Compilador C/C++ (`gcc`, `make`) |
| `libssl-dev` | OpenSSL |
| `libayatana-appindicator3-dev` | Tray / indicador (Linux) |
| `librsvg2-dev` | Ícones SVG |
| `libxdo-dev` | Automação de janela (plugin opener) |
| `curl`, `wget`, `file` | Utilitários usados no setup |

Referência oficial: [Prerequisites Tauri 2](https://v2.tauri.app/start/prerequisites/)

### Obrigatório — Android (`make apk`)

Além de **Node**, **Rust** e **npm**, o build Android exige o toolchain do Android Studio.

| Ferramenta | Observação |
|---|---|
| **Android Studio** | SDK, emulador e NDK — [developer.android.com/studio](https://developer.android.com/studio) |
| **JDK 17+** | Incluso no Android Studio (`jbr/`) ou via `openjdk-17-jdk` (apt) |
| **Android SDK** | Platform, Platform-Tools, Build-Tools, Command-line Tools |
| **NDK (Side by side)** | Instalado pelo SDK Manager do Android Studio |
| **Rust Android targets** | Instalados por `make install-android-deps` |

Pacotes a instalar no **SDK Manager** (Android Studio → Settings → Languages & Frameworks → Android SDK):

- Android SDK Platform (API recente, ex.: 34 ou 35)
- Android SDK Platform-Tools
- Android SDK Build-Tools
- NDK (Side by side)
- Android SDK Command-line Tools

Variáveis de ambiente (adicione ao `~/.bashrc` ou exporte no terminal antes do build):

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export JAVA_HOME="$HOME/android-studio/jbr"   # ajuste se o Studio estiver em outro caminho
# NDK_HOME é derivado automaticamente pelo Makefile a partir de $ANDROID_HOME/ndk/
```

Referência: [Prerequisites Tauri 2 — Android](https://v2.tauri.app/start/prerequisites/#android)

### macOS

- **Xcode Command Line Tools:** `xcode-select --install`

### Windows

- **Visual Studio Build Tools** (Desktop development with C++)
- **WebView2 Runtime**

### Opcional

- **make** — atalhos na raiz do projeto (`Makefile`)

---

## Setup inicial

Clone o repositório e, na **raiz do projeto**:

### Opção recomendada — um comando

```bash
make setup
```

O `make setup` executa, nesta ordem:

| Etapa | Comando interno | O que faz |
|---|---|---|
| 1 | `make install` | `npm install` — dependências Node |
| 2 | `make install-rust` | Instala **Rust** via rustup se `cargo` não existir |
| 3 | `make install-tauri-deps` | Instala **dependências de SO** no Linux (apt + sudo) |
| 4 | `make icons` | Gera ícones Tauri a partir de `public/favicon.svg` |

> **Linux:** `install-tauri-deps` pede senha `sudo`. Se já tiver `pkg-config` e `glib-2.0`, o passo é ignorado.

### Passo a passo manual

```bash
# 1. Node
npm install

# 2. Rust (se ainda não tiver)
make install-rust
# ou: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Depois: source "$HOME/.cargo/env"

# 3. Dependências de SO — Linux (Debian/Ubuntu)
make install-tauri-deps
# ou manualmente:
# sudo apt update
# sudo apt install -y pkg-config libwebkit2gtk-4.1-dev build-essential \
#   curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

# 4. Ícones Tauri
make icons
```

### Verificar instalação

```bash
make check      # TypeScript + build frontend
make help       # Lista todos os comandos Make

# Opcional — confirmar toolchain desktop
cargo --version
rustc --version
pkg-config --version          # Linux
pkg-config --exists glib-2.0  # Linux — deve retornar 0
```

### Setup Android (primeira vez)

Depois de instalar o Android Studio e os pacotes do SDK:

```bash
# Recomendado — instala targets Rust, valida JDK/SDK/NDK e roda android-init
make setup-android
```

Passo a passo equivalente:

```bash
make install-android-deps   # Rust targets + OpenJDK 17 (apt) + checagem SDK/NDK
make android-init           # cria src-tauri/gen/android/ (só uma vez por clone)
```

> **`android-init`** só precisa rodar **uma vez** por clone do repositório. Se `src-tauri/gen/android/` já existir, pule este passo.

---

## Comandos de desenvolvimento

### Via Makefile (recomendado)

| Comando | Descrição |
|---|---|
| `make` / `make help` | Lista comandos disponíveis |
| `make setup` | Setup completo: Node + Rust + deps SO + ícones |
| `make install` | Instala dependências Node (`npm install`) |
| `make install-rust` | Instala Rust (rustup) se `cargo` não existir |
| `make install-tauri-deps` | Instala deps de SO para Tauri (Linux/apt; pede sudo) |
| `make dev` | Sobe o frontend (Vite) — browser |
| `make app` / `make run` | Sobe a aplicação desktop (Tauri + Vite) |
| `make build` | Build de produção do frontend |
| `make tauri-build` | Build de produção do app desktop |
| `make preview` | Preview do build frontend |
| `make icons` | Regenera ícones a partir de `public/favicon.svg` |
| `make check` | Valida TypeScript e build |
| `make clean` | Remove `dist`, cache TS e `src-tauri/target` |

#### Android (APK)

| Comando | Descrição |
|---|---|
| `make install-android-deps` | Instala Rust targets Android + OpenJDK 17 (apt) e valida SDK/NDK |
| `make setup-android` | Setup Android completo: deps + `android-init` |
| `make android-init` | **[1×]** Inicializa o target Android no Tauri |
| `make android-dev` | Roda no emulador ou dispositivo (modo dev) |
| `make android-install` | **Recomendado** — APK debug assinado + instala via `adb` |
| `make android-build-debug` | Gera **APK debug** assinado (instalável) |
| `make android-build` | Gera **APK release unsigned** (não instala direto) |
| `make apk` | Alias para release unsigned |
| `make android-run` | Instala e executa build release no dispositivo |

### Via npm

| Script | Comando | Descrição |
|---|---|---|
| `dev` | `npm run dev` | Servidor Vite |
| `build` | `npm run build` | `tsc -b && vite build` |
| `preview` | `npm run preview` | Preview estático |
| `tauri` | `npm run tauri -- <cmd>` | CLI Tauri (`dev`, `build`, `icon`, etc.) |

---

## Modos de execução

### 1. Frontend no browser (desenvolvimento rápido)

```bash
make dev
# → http://localhost:5173/
```

- **Não** requer Rust nem deps de SO.
- Na primeira execução, exibe **Setup Inicial de Persistência** (`PersistenceSetupPage`).
- Modo **Local** no browser exibe *"O modo local requer o aplicativo desktop."* — SQLite **não** é inicializado.
- Modo **Remoto** salva a URL do servidor e opera via **Remote API Adapter** (HTTP).
- Útil para iterar em UI, rotas, widgets, fluxo de setup e integração com o backend.

### 2. Aplicação desktop (Tauri)

```bash
make app
# equivalente: npm run tauri dev
```

- Requer **Rust** e **dependências de SO** (ver [Setup inicial](#setup-inicial)).
- `make app` verifica `cargo` e `pkg-config` antes de compilar.
- Inicia o Vite automaticamente (`beforeDevCommand` em `tauri.conf.json`).
- Abre janela nativa em `http://localhost:5173`.
- Na primeira execução, o usuário escolhe **Local** ou **Remoto** no setup (`PersistenceSetupPage`).
- Modo **Local** → `AppBootstrap` chama `initializeDatabase()` antes de renderizar o app.
- Banco local: `fluxor.db` (diretório de config do app — gerenciado pelo Tauri).
- Modo **Remoto** → SQLite **não** é inicializado; dados via **Remote API Adapter** (HTTP → Fastify → MariaDB).

### 3. Validar SQLite (modo DEV)

Com o app desktop rodando:

1. Home → ícone **⚙** (Configurações)
2. **Diagnóstico DEV** (visível apenas com `import.meta.env.DEV`)
3. **Testar cadastros básicos** — executa use cases de Wallet, Category e Payee

Documentação de schema e serviços: [sqlite-schema-v1.md](./sqlite-schema-v1.md), [application-services-v1.md](./application-services-v1.md).

### 4. Android (emulador ou dispositivo)

```bash
make android-dev
```

- Requer setup Android concluído (ver [Setup Android](#setup-android-primeira-vez)).
- Emulador aberto no Android Studio **ou** celular conectado com **USB debugging** ativo.
- Equivalente: `npm run tauri android dev`.

---

## Build e distribuição

### Frontend (assets estáticos)

```bash
make build
```

Saída em `dist/` — HTML, JS e CSS prontos para servir estaticamente.

### App desktop (instalável)

```bash
make tauri-build
# equivalente: npm run build && npm run tauri build
```

Fluxo interno:

1. `npm run build` compila o frontend para `dist/`
2. Tauri compila o Rust em release e empacota o bundle

Artefatos gerados em `src-tauri/target/release/bundle/` (formato varia por SO: `.deb`, `.AppImage`, `.dmg`, `.msi`, etc.).

### Android (APK)

O Fluxor usa **Tauri 2** para compilar o mesmo frontend React + SQLite nativo para Android. Os comandos ficam no `Makefile` da raiz.

#### Pré-requisitos

1. Android Studio instalado com SDK e NDK (ver [Pré-requisitos — Android](#obrigatório--android-make-apk)).
2. Variáveis `ANDROID_HOME` e `JAVA_HOME` exportadas no terminal.
3. Target Android inicializado (`make android-init` ou `make setup-android`).

#### Gerar APK — fluxo rápido

```bash
# Primeira vez (por clone)
make setup-android

# Instalar no celular (recomendado — APK debug assinado)
make android-install

# Só gerar APK release (unsigned — NÃO instala direto no celular)
make apk

# Só gerar APK debug, sem instalar
make android-build-debug
```

#### O que cada comando faz

| Comando | Tipo de APK | Instala no celular? |
|---|---|---|
| `make android-install` | Debug assinado | **Sim** — build + `adb install` |
| `make android-build-debug` | Debug assinado | **Sim** — transferir `dist/android/fluxor-debug.apk` |
| `make apk` / `make android-build` | Release **unsigned** | **Não** — Android mostra *pacote inválido* |

Fluxo interno do build:

1. `npm run build` — compila o frontend para `dist/`
2. `npm run tauri android build --apk` — compila Rust para Android e empacota o APK via Gradle

#### Onde fica o APK

Após o build, os arquivos `.apk` aparecem em:

```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```

O `Makefile` também copia:

- **Instalável:** `dist/android/fluxor-debug.apk` (após `make android-build-debug`)
- **Não instalável:** `dist/android/fluxor-release-unsigned.apk` (release sem assinatura)

> **"Pacote inválido" ao instalar?** Você provavelmente usou o **release unsigned** (`make apk`). O Android **exige assinatura**. Use `make android-install` ou instale `dist/android/fluxor-debug.apk`.

Exemplos por tipo:

- Release: `.../apk/universal/release/app-universal-release-unsigned.apk`
- Debug: `.../apk/universal/debug/app-universal-debug.apk`

**Instalar no celular:**

```bash
make android-install
```

Ou manualmente (celular com USB debugging):

```bash
adb install -r dist/android/fluxor-debug.apk
```

> **Build deu certo mesmo com warnings?** Sim. Mensagens de depreciação do Gradle/Kotlin, o `problems-report.html` e *"Supplied consumer proguard configuration does not exist"* são **avisos**, não falha.

#### Instalar e rodar no dispositivo

```bash
make android-run    # build release + instala + abre no aparelho
make android-dev    # modo desenvolvimento (hot reload via rede)
```

#### Assinatura (release / Play Store)

O build release atual gera APK **unsigned** ou com assinatura debug, dependendo da configuração Gradle gerada pelo Tauri. Para publicar na Google Play:

1. Criar um **keystore** de release.
2. Configurar assinatura em `src-tauri/gen/android/` (Gradle).
3. Preferir **AAB** (`npm run tauri android build -- --aab`) para upload na Play Console.

> Ainda **não** documentamos keystore neste repo — necessário antes de publicar em produção.

#### Limitações conhecidas (Android)

- UI pensada inicialmente para **desktop** — pode precisar de ajustes de layout mobile.
- Anexos usam `localPath` no filesystem — validar permissões de armazenamento no Android.
- `tauri-plugin-sql` suporta Android; iOS **não** é suportado pelo plugin na versão atual.

Referência: [Tauri — Android](https://v2.tauri.app/develop/mobile/android/)

### Limpeza

```bash
make clean
```

Remove artefatos de build sem apagar `node_modules`.

---

## Arquitetura do projeto

```
fluxor/
├── docs/
│   ├── TECNICO.md                  # Setup, build, persistência (este guia)
│   ├── arquitetura-home-widgets.md # Home e widgets modulares
│   ├── application-services-v1.md
│   ├── modelo-conceitual-v1.md
│   ├── sqlite-schema-v1.md
│   ├── remote-api-v1.md
│   └── sync-v1.md                  # Referência histórica (suspenso)
├── public/
│   └── favicon.svg         # Fonte dos ícones Tauri
├── src/                    # Frontend React
│   ├── app/                # Bootstrap (App.tsx → AppBootstrap.tsx)
│   ├── components/         # Componentes reutilizáveis
│   ├── features/           # Módulos por domínio (home, persistence, widgets, export…)
│   ├── layouts/            # Layouts de página
│   ├── pages/              # Páginas (views)
│   ├── routes/             # Configuração de rotas
│   ├── styles/             # CSS global e tokens Tailwind
│   ├── types/              # Tipos TypeScript compartilhados
│   ├── utils/              # Funções utilitárias
│   └── main.tsx            # Entry point React
├── src-tauri/              # Backend Tauri (Rust)
│   ├── capabilities/       # Permissões Tauri 2
│   ├── gen/android/        # Projeto Gradle Android (após make android-init)
│   ├── icons/              # Ícones gerados (não editar manualmente)
│   ├── src/
│   │   ├── lib.rs          # Setup de plugins e app
│   │   └── main.rs         # Entry point Rust
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── build.rs
├── Makefile
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

### Responsabilidade por pasta (`src/`)

| Pasta | Quando usar |
|---|---|
| `app/` | Composição raiz, providers globais |
| `components/` | UI genérica e reutilizável (botões, inputs, tabelas) |
| `features/` | Lógica e UI agrupadas por domínio (ex.: `payables/`, `receivables/`) |
| `layouts/` | Estruturas de página (header, sidebar, shell) |
| `pages/` | Views ligadas a rotas |
| `routes/` | Definição de rotas (React Router) |
| `features/persistence/` | Ports, provider, adapters SQLite e Remote API |
| `features/persistence-setup/` | Setup inicial Local/Remoto |
| `features/widgets/` | Registry e widgets modulares da Home |
| `features/*/application` | Use cases (regras de negócio) |
| `styles/` | Tokens, resets, imports Tailwind |
| `types/` | Interfaces e tipos compartilhados |
| `utils/` | Helpers puros (formatação, detecção de plataforma) |

### Alias de importação

O Vite resolve `@/` para `src/`:

```typescript
import { HomePage } from "@/pages/HomePage";
```

Configurado em `vite.config.ts` e `tsconfig.app.json`.

---

## Persistência

A camada de persistência foi desacoplada para suportar SQLite local e API remota, sem alterar use cases nem regras de negócio.

### Remote Persistence MVP

**Status:** Concluído

O app já pode operar diretamente contra a API remota sem utilizar SQLite. A mesma UI, widgets e use cases funcionam em ambos os modos.

#### Fluxo remoto

```text
UI
↓
Use Cases
↓
resolvePersistence()
↓
Remote API Adapter
↓
HTTP
↓
Fastify
↓
Use Cases Server
↓
MariaDB
```

#### Fluxo local

```text
UI
↓
Use Cases
↓
resolvePersistence()
↓
SQLite Adapter
↓
SQLite
```

#### Provider Selection

A seleção do provider de persistência ocorre **exclusivamente** por este fluxo:

```text
Persistence Setup
↓
PersistenceConfig
↓
resolvePersistence()
↓
Provider ativo
```

Não há outro mecanismo de seleção de persistência no app. A configuração (`PersistenceConfig`) fica em `localStorage` (fora do SQLite) para que o modo seja conhecido antes de qualquer acesso ao banco.

### Arquitetura

```
UI
  ↓
Use Cases
  ↓
Persistence Ports
  ↓
Persistence Provider
  ↓
Persistence Adapter
    ├─ SQLite (modo Local)
    └─ Remote API (modo Remoto)
```

### Componentes

| Camada | Pasta | Descrição |
|---|---|---|
| **Ports** | `src/features/persistence/ports/` | Contratos por entidade (`WalletRepositoryPort`, `FinancialRecordRepositoryPort`, …) |
| **Provider** | `src/features/persistence/providers/` | Agrega todos os ports; interface `PersistenceProvider` |
| **Adapter SQLite** | `src/features/persistence/adapters/sqlite/` | Implementação dos ports via `tauri-plugin-sql` (modo Local) |
| **Adapter Remote API** | `src/features/persistence/adapters/remote-api/` | Implementação dos ports via HTTP (modo Remoto) |
| **Setup** | `src/features/persistence-setup/` | Escolha e reconfiguração do modo de persistência |

### Setup Inicial de Persistência

Na primeira execução (sem configuração salva), o app renderiza `PersistenceSetupPage` em vez de inicializar o banco.

O usuário escolhe:

| Opção | Comportamento |
|---|---|
| **Local** | Dados no dispositivo via SQLite. No browser, bloqueado com mensagem explicativa. No Tauri, prossegue normalmente. |
| **Remoto** | Informa URL do servidor; config salva; app opera via Remote API Adapter. |

A configuração é persistida em **`localStorage`** (chave `fluxor:persistence-config`), **fora do SQLite**, para que o app saiba qual provider usar antes de qualquer acesso ao banco.

```typescript
type PersistenceMode = "local" | "remote";

type PersistenceConfig = {
  mode: PersistenceMode;
  remoteBaseUrl?: string;
  configuredAt: string;
};
```

Serviço: `src/features/persistence-setup/services/persistence-config.service.ts`

- `getPersistenceConfig()` · `savePersistenceConfig()` · `resetPersistenceConfig()` · `hasPersistenceConfig()`

### Bootstrap da aplicação

`App.tsx` → `AppBootstrap.tsx`:

```
App inicia
  ↓
getPersistenceConfig()
  ↓
Existe configuração?
  ├─ Não → PersistenceSetupPage
  └─ Sim
        ├─ local (Tauri)  → initializeDatabase() → AppRouter
        ├─ local (browser)→ mensagem de bloqueio
        └─ remote         → AppRouter (Remote API Adapter)
```

### `resolvePersistence()`

`src/features/persistence/providers/resolve-persistence.ts`:

1. Lê `getPersistenceConfig()`.
2. Sem config → `PersistenceNotConfiguredError`.
3. `mode: "remote"` → `createRemoteApiPersistenceProvider(remoteBaseUrl)`.
4. `mode: "local"` → `ensureDatabaseReady()` → `createSqlitePersistenceProvider(db)`.

Use cases (`wallet.use-cases.ts`, `category.use-cases.ts`, etc.) chamam `resolvePersistence()` e consomem os ports — **sem dependência direta de SQLite**.

### Reconfiguração

Em **Configurações → Fonte de Dados**, o usuário vê o modo atual e pode **Reconfigurar fonte de dados** (`resetPersistenceConfig()` + reload → volta ao setup).

### Estado atual

| Item | Status |
|---|---|
| SQLite como provider | ✅ Implementado (modo Local) |
| Remote API Adapter | ✅ Implementado (modo Remoto) |
| Troca de provider | ✅ Via `PersistenceConfig` + `resolvePersistence()` |
| Sync V1 (arquivos) | ⚠️ Suspenso — ver [sync-v1.md](./sync-v1.md) |

Documentação de domínio: [application-services-v1.md](./application-services-v1.md) · [sqlite-schema-v1.md](./sqlite-schema-v1.md) · [modelo-conceitual-v1.md](./modelo-conceitual-v1.md).

---

## Convenções de código

- **TypeScript strict** — sem `any` desnecessário.
- **Componentes funcionais** com hooks.
- **Um componente por arquivo**, nome em PascalCase.
- **Features** agrupam tudo de um domínio; evite lógica de negócio espalhada em `pages/`.
- **Serviços** concentram I/O (banco, Tauri invoke, filesystem).
- **Estilos** via Tailwind; tokens customizados em `src/styles/globals.css` (`@theme`).
- **Alta densidade de informação** — layouts compactos, tipografia 14px base, espaçamento enxuto.
- **Offline first** — assumir ausência de rede; persistência local como fonte de verdade.

---

## Frontend (React)

### Entry point

`src/main.tsx` → `src/app/App.tsx` → `AppBootstrap.tsx` → `src/routes/index.tsx`

### Roteamento

React Router v7 com `BrowserRouter`. Rotas definidas em `src/routes/index.tsx`. Novas páginas:

1. Criar componente em `src/pages/`
2. Registrar rota em `src/routes/index.tsx`
3. Envolver com layout em `src/layouts/` se necessário

### Detecção de runtime

`src/utils/platform.ts` usa `@tauri-apps/api/core` (`isTauri()`) para distinguir browser vs desktop.

### Estilos (Tailwind 4)

- Plugin: `@tailwindcss/vite` em `vite.config.ts`
- Import global: `src/styles/globals.css`
- Tema escuro com tokens CSS customizados (`--color-surface`, `--color-accent`, etc.)

---

## Backend (Tauri / Rust)

### Configuração principal

| Arquivo | Função |
|---|---|
| `src-tauri/tauri.conf.json` | Janela, build, bundle, identificador |
| `src-tauri/capabilities/default.json` | Permissões Tauri 2 |
| `src-tauri/Cargo.toml` | Dependências Rust |
| `src-tauri/src/lib.rs` | Registro de plugins e builder |

### Janela padrão

- Título: **Fluxor**
- Tamanho: 1100×720 (mínimo 800×600)
- Redimensionável

### Plugins ativos

- `tauri-plugin-opener` — abrir URLs/arquivos no SO
- `tauri-plugin-sql` — SQLite local (`sqlite:fluxor.db`)

### Adicionar comando Tauri (referência futura)

1. Definir função `#[tauri::command]` em `src-tauri/src/lib.rs`
2. Registrar em `.invoke_handler(tauri::generate_handler![...])`
3. Adicionar permissão em `capabilities/default.json`
4. Chamar do frontend via `@tauri-apps/api/core` (`invoke`)

---

## SQLite

> **Status:** adapter SQLite implementado como provider do modo **Local**. Home integrada com dados reais via use cases. SQLite **não** é inicializado automaticamente — apenas após configuração Local no Tauri.

| Item | Valor |
|---|---|
| Plugin | `@tauri-apps/plugin-sql` / `tauri-plugin-sql` |
| Arquivo | `fluxor.db` |
| Migrations | `src/features/database/migrations/` |
| Adapter | `src/features/persistence/adapters/sqlite/` |
| Use cases | `wallets`, `categories`, `payees`, `financial-records` |
| Diagnóstico DEV | Configurações → Diagnóstico DEV |

Documentação de domínio: [sqlite-schema-v1.md](./sqlite-schema-v1.md) · [application-services-v1.md](./application-services-v1.md).

### Fluxo de inicialização

```
AppBootstrap (modo local + Tauri)
  → getPersistenceConfig() confirma mode: "local"
  → initializeDatabase()
  → Database.load("sqlite:fluxor.db")
  → PRAGMA foreign_keys = ON
  → runPendingMigrations() → schema_migration
  → AppRouter
```

### Tabelas na migration v1

`wallet`, `category`, `payee`, `payee_document`, `payee_payment_method`

### Tabelas na migration v2

`financial_record`, `attachment`, `transfer_link`, `recurrence_batch`, `financial_record_history_event`

---

## Configuração e variáveis

### Ambiente (`.env`)

Arquivo de referência: `.env.example`. Copiar na primeira vez:

```bash
make env
# ou: cp .env.example .env
```

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_DEV_PORT` | `5173` | Porta do Vite em desenvolvimento |

O Vite lê `.env` via `loadEnv` em `vite.config.ts`. O wrapper `scripts/tauri-cli.mjs` injeta o mesmo `devUrl` no `tauri dev`, mantendo app desktop e browser na mesma porta.

Reinicie o servidor de desenvolvimento após alterar `.env` (hot reload não recarrega variáveis de ambiente).

### Vite (`vite.config.ts`)

| Opção | Valor | Notas |
|---|---|---|
| `server.port` | `VITE_DEV_PORT` ou `5173` | `strictPort: true` — falha se ocupada |
| `envPrefix` | `VITE_`, `TAURI_` | Variáveis expostas ao frontend |
| `build.target` | `es2022` | Alinhado ao WebView moderno |

### Tauri (`tauri.conf.json`)

| Campo | Valor |
|---|---|
| `build.devUrl` | `http://localhost:5173` (padrão no JSON; sobrescrito em `tauri dev` pelo `.env`) |
| `build.frontendDist` | `../dist` |
| `build.beforeDevCommand` | `npm run dev` |
| `build.beforeBuildCommand` | `npm run build` |

### Ícones

Fonte: `public/favicon.svg`

Regenerar após alterar o favicon:

```bash
make icons
```

Saída em `src-tauri/icons/` — não editar manualmente.

---

## Solução de problemas

### Porta 5173 em uso

```bash
lsof -i :5173
```

Altere no `.env`:

```env
VITE_DEV_PORT=5174
```

Reinicie `make dev` ou `make app`.

### `make app` falha — `ENOSPC` / file watchers (Linux)

Erro típico após build Android:

```
Error: ENOSPC: System limit for number of file watchers reached
.../src-tauri/gen/android/app/build/...
```

**Causa:** o Vite observa mudanças no projeto; artefatos Gradle/Kotlin em `src-tauri/gen/android/` consomem o limite de `inotify`.

**Solução no projeto:** `vite.config.ts` ignora `src-tauri/gen/**` e `src-tauri/target/**` (já configurado).

Se ainda ocorrer (projeto grande ou muitos watchers no SO):

```bash
# Temporário (até reiniciar)
sudo sysctl fs.inotify.max_user_watches=524288

# Permanente (Debian/Ubuntu)
echo fs.inotify.max_user_watches=524288 | sudo tee /etc/sysctl.d/99-inotify.conf
sudo sysctl --system
```

Opcional — limpar artefatos Android sem apagar o projeto Gradle:

```bash
rm -rf src-tauri/gen/android/app/build src-tauri/gen/android/build
```

### `make app` falha — `cargo` não encontrado

```bash
make install-rust
# ou: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
cargo --version
```

O `make setup` já inclui `install-rust`. Fora do Make, adicione `~/.cargo/bin` ao PATH ou execute `source "$HOME/.cargo/env"`.

### `make app` falha — `pkg-config` / `glib-2.0` (Linux)

Erro típico:

```
Could not run pkg-config --libs --cflags glib-2.0
The pkg-config command could not be found.
```

Solução:

```bash
make install-tauri-deps
```

Equivalente manual (Debian/Ubuntu):

```bash
sudo apt update
sudo apt install -y pkg-config libwebkit2gtk-4.1-dev build-essential \
  curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

### Compilação Rust lenta na primeira vez

Normal — o Cargo baixa e compila centenas de crates. Execuções seguintes são incrementais.

### Build TypeScript falha

```bash
make check
```

Erros comuns: imports não usados (`noUnusedLocals`), paths `@/` incorretos.

### SQLite não funciona / teste DEV falha

- Confirme que abriu via **`make app`**, não `make dev` no browser externo.
- Configurações → Diagnóstico DEV → verifique status `ready` e migrations aplicadas.
- Se status `error`, leia a mensagem JSON no painel.

### Build Android — `JAVA_HOME` / `ANDROID_HOME` não encontrado

Erros típicos:

```
Java not found in PATH
Android SDK não encontrado em /home/.../Android/Sdk
NDK não encontrado em .../ndk
```

Solução:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export JAVA_HOME="$HOME/android-studio/jbr"   # ou /usr/lib/jvm/java-17-openjdk-amd64
make install-android-deps   # valida ambiente
```

Instale o NDK pelo Android Studio: **SDK Manager → SDK Tools → NDK (Side by side)**.

### Build Android — target não inicializado

```
Erro: target Android não inicializado.
Execute uma vez: make android-init
```

```bash
make android-init
# ou: make setup-android
```

### Build Android — emulador / dispositivo

- **Emulador:** abra um AVD no Android Studio antes de `make android-dev`.
- **Celular físico:** ative **Opções do desenvolvedor → Depuração USB** e autorize o computador.
- Verifique: `adb devices` deve listar o aparelho.

### Build Android — terminou com warnings, “não gerou APK”

O Gradle gera `src-tauri/gen/android/build/reports/problems/problems-report.html` com **avisos de depreciação** — isso não impede o APK.

Confirme se o arquivo existe:

```bash
ls -lh src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
ls -lh dist/android/fluxor-release-unsigned.apk   # cópia após make apk
```

Se existir (~25 MB), o build **funcionou**. Para instalar no celular, use `make android-install` — **não** o release unsigned.

### Build Android — "Pacote inválido" / "App not installed"

Causa quase sempre: tentativa de instalar `fluxor-release-unsigned.apk` ou `app-universal-release-unsigned.apk`.

O `make apk` gera release **sem assinatura digital**. O Android rejeita na instalação.

**Solução:**

```bash
make android-install
```

Requisitos: celular conectado, USB debugging ativo, `adb devices` listando o aparelho.

### Ícones ausentes no build Tauri

```bash
make icons
```

---

## Roadmap técnico

| Etapa | Status | Descrição |
|---|---|---|
| Setup React + Vite + Tauri 2 | ✅ Concluído | Estrutura base, Home, Makefile |
| SQLite + cadastros básicos | ✅ Concluído | Migrations, Wallet/Category/Payee, painel DEV |
| Camada de persistência desacoplada | ✅ Concluído | Ports, provider, adapter SQLite |
| Setup inicial de persistência | ✅ Concluído | Local/Remoto via `localStorage` |
| Integração Home com SQLite | ✅ Concluído | Registros reais, widgets, exportação |
| Widgets modulares (3) | ✅ Concluído | Resumo, Calendário, Categorias — ver [arquitetura-home-widgets.md](./arquitetura-home-widgets.md) |
| CRUD FinancialRecord (UI) | 🔲 Pendente | Telas do módulo principal |
| Adapter Remote API | ✅ Concluído | Remote Persistence MVP — HTTP → Fastify → MariaDB |
| Build Android (APK) | ✅ Makefile | `make apk`, `make setup-android` — ver [Android (APK)](#android-apk) |
| Assinatura release Android | 🔲 Pendente | Keystore + Play Store |
| Sync V1 (arquivos) | ⚠️ Suspenso | Referência histórica em [sync-v1.md](./sync-v1.md) |
| Testes automatizados | 🔲 Pendente | Vitest + Testing Library |

---

## Histórico de versões (técnico)

| Versão | Data | Mudanças |
|---|---|---|
| 0.1.0 | 2026-06 | Setup: React 19, Vite 6, Tauri 2, Tailwind 4, persistência desacoplada, setup Local/Remoto, Home + widgets + exportação, Configurações, Makefile desktop + **comandos Android/APK** |

---

*Última atualização: junho/2026 — mantenha este documento sincronizado com o código.*
