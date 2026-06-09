# Temas V1 — Fluxor

> Sistema de temas desacoplado por manifest. Referência: [TECNICO.md](./TECNICO.md)

**Versão:** 1 · **Última atualização:** junho/2026

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Temas incluídos](#3-temas-incluídos)
4. [Adicionar um tema](#4-adicionar-um-tema)
5. [Contrato do manifest](#5-contrato-do-manifest)
6. [Tokens semânticos](#6-tokens-semânticos)
7. [Como os componentes consomem o tema](#7-como-os-componentes-consomem-o-tema)
8. [Persistência e seleção](#8-persistência-e-seleção)
9. [Validação e erros comuns](#9-validação-e-erros-comuns)
10. [Limitações V1](#10-limitações-v1)
11. [Referências cruzadas](#11-referências-cruzadas)

---

## 1. Visão geral

O Fluxor usa **tokens semânticos** para identidade visual. Componentes, layouts, widgets e telas **não** definem cores diretamente — consomem classes como `bg-background`, `text-text-primary` e `text-income`.

A troca de tema altera apenas as **CSS variables** (`--theme-*`) aplicadas em `:root`. Não é necessário reiniciar o aplicativo.

Para adicionar um tema novo, basta criar uma pasta com `manifest.json` em `src/config/theme/themes/`. O sistema descobre os manifests automaticamente em tempo de build via `import.meta.glob` (Vite). **Não é necessário alterar** `index.ts`, `theme.service.ts`, componentes ou telas.

---

## 2. Arquitetura

```
src/config/theme/themes/<id>/manifest.json
            ↓
    theme.registry.ts          ← escaneia pastas (build time)
            ↓
    theme.service.ts           ← aplica CSS vars + localStorage
            ↓
    ThemeProvider              ← estado React + troca instantânea
            ↓
    globals.css (@theme)       ← Tailwind utilities
            ↓
    Componentes                ← classes semânticas (bg-surface, text-primary, …)
```

| Camada | Arquivo | Responsabilidade |
|---|---|---|
| **Manifests** | `themes/<id>/manifest.json` | Definição de cada tema (fonte editável) |
| **Registry** | `theme.registry.ts` | Descoberta, validação e catálogo |
| **Service** | `theme.service.ts` | Persistência e aplicação em `document.documentElement` |
| **Provider** | `ThemeProvider.tsx` | Contexto React (`useTheme`) |
| **Fallback CSS** | `styles/theme.css` | Valores do tema escuro antes do JavaScript carregar |
| **Bridge Tailwind** | `styles/globals.css` | Mapeia `--theme-*` → utilities Tailwind |

---

## 3. Temas incluídos

| ID | Label | Descrição |
|---|---|---|
| `dark` | Escuro | Tema padrão (`"default": true`) — fundo escuro, primary ciano |
| `light` | Claro | Fundo claro, textos escuros, primary azul |
| `one-dark` | One Dark | Baseado no tema One Dark do Atom — `#282c34`, azul `#61afef` |
| `one-light` | One Light | Baseado no tema One Light do Atom — `#fafafa`, azul `#4078f2` |
| `atomo-dark` | Atomo Dark | Tema original Atom Dark — `#1d1f21`, azul `#5293d8` |
| `atomo-light` | Atomo Light | Tema original Atom Light — `#f4f4f4`, azul `#5293d8` |
| `isotopo-light` | Isotopo Light | Isotope Light UI — fundo `#f0f0f0`, azul `#3399cc` |
| `metro-ui` | Metro UI | Metro UI (variante Light) — branco, accent `#0078d7` |
| `accents-ui` | Accents UI | Accents UI — escuro `#242424`, accent Azure `#1e91f0` |
| `slacks-ui` | Slacks UI | Slack UI — fundo `#F9F9F9`, azul `#3aa3e3` |
| `unicorn-light-ui` | Unicorn Light UI | Atom Unicorn Light UI — eggshell `#F4F0E8`, café `#7C705F`, azul `#3D728E` |

Pasta de cada tema:

```text
src/config/theme/themes/
├── dark/manifest.json
├── light/manifest.json
├── one-dark/manifest.json
├── one-light/manifest.json
├── atomo-dark/manifest.json
├── atomo-light/manifest.json
├── isotopo-light/manifest.json
├── metro-ui/manifest.json
├── accents-ui/manifest.json
├── slacks-ui/manifest.json
└── unicorn-light-ui/manifest.json
```

---

## 4. Adicionar um tema

### Passo a passo

1. Crie a pasta `src/config/theme/themes/<id>/` (ex.: `ocean`)
2. Adicione `manifest.json` com `"id": "<id>"` **igual ao nome da pasta**
3. Preencha todos os [tokens obrigatórios](#6-tokens-semânticos)
4. Reinicie o dev server (`make dev` ou `npm run dev`) ou rode `make build`

O tema aparece automaticamente em **Configurações → Tema**.

### Exemplo completo

Arquivo: `src/config/theme/themes/ocean/manifest.json`

```json
{
  "id": "ocean",
  "label": "Oceano",
  "order": 3,
  "preview": {
    "background": "#0c1929",
    "accent": "#29b6f6"
  },
  "tokens": {
    "background": "#0c1929",
    "surface": "#132f4c",
    "surfaceSoft": "#1a3a5c",
    "border": "#265d97",
    "textPrimary": "#e3f2fd",
    "textSecondary": "#90caf9",
    "primary": "#29b6f6",
    "primarySoft": "rgba(41, 182, 246, 0.12)",
    "primaryForeground": "#0c1929",
    "link": "#29b6f6",
    "linkSoft": "rgba(41, 182, 246, 0.12)",
    "income": "#26a69a",
    "expense": "#ef5350",
    "warning": "#ffa726",
    "muted": "#5c7a99",
    "actionGradient": "linear-gradient(135deg, #29b6f6 0%, #0288d1 100%)"
  }
}
```

### O que **não** precisa ser alterado

| Área | Motivo |
|---|---|
| Componentes, layouts, widgets, telas | Usam tokens semânticos |
| `theme.service.ts` / `theme.registry.ts` | Descoberta automática |
| `SettingsPage` | Lista `themeCatalog` do registry |
| `globals.css` | Já mapeia todos os tokens via CSS variables |

---

## 5. Contrato do manifest

| Campo | Obrigatório | Tipo | Descrição |
|---|---|---|---|
| `id` | sim | `string` | Identificador único; **deve coincidir** com o nome da pasta |
| `label` | sim | `string` | Nome exibido no seletor de Configurações |
| `order` | não | `number` | Ordem no seletor (menor = primeiro; default `999`) |
| `default` | não | `boolean` | Tema padrão quando não há preferência salva — **apenas um** deve ter `true` |
| `preview` | não | `object` | Cores do círculo no seletor (ver abaixo) |
| `tokens` | sim | `object` | Os 14 tokens semânticos |

### Campo `preview`

Opcional. Usado apenas no círculo de pré-visualização em Configurações.

| Subcampo | Descrição | Fallback |
|---|---|---|
| `background` | Cor de fundo do círculo | `tokens.background` |
| `accent` | Cor do anel/borda | `tokens.primary` |

---

## 6. Tokens semânticos

Todos os campos abaixo são **obrigatórios** em `tokens`:

| Token | Uso típico |
|---|---|
| `background` | Fundo principal do app |
| `surface` | Cards, painéis, sheets |
| `surfaceSoft` | Hover, áreas secundárias |
| `border` | Bordas e divisores |
| `textPrimary` | Texto principal |
| `textSecondary` | Texto secundário, legendas |
| `primary` | Botões sólidos, CTAs, indicadores de marca |
| `primarySoft` | Fundo suave de elementos primary (uso reservado a CTAs) |
| `primaryForeground` | Texto sobre fundo `primary` |
| `link` | Links, texto de ação, foco, seleção e hovers interativos |
| `linkSoft` | Fundo suave de estados link (seleção, hover, destaque leve) |
| `income` | Valores positivos / recebíveis |
| `expense` | Valores negativos / pagáveis |
| `warning` | Alertas, badges DEV |
| `muted` | Texto desabilitado, placeholders |
| `actionGradient` | Botões de ação com gradiente (classe `bg-action-gradient`) |

### Convenções de valor

| Tipo | Formato | Exemplo |
|---|---|---|
| Cor sólida | Hex ou `rgba()` | `"#2563eb"`, `"rgba(37, 99, 235, 0.1)"` |
| Gradiente | CSS `linear-gradient` | `"linear-gradient(135deg, #29b6f6 0%, #0288d1 100%)"` |

### `primary` vs `link`

- **`primary`** — botões sólidos (`bg-primary`), carrossel ativo, badges de contagem.
- **`link`** — ações em texto (Salvar, Limpar, Hoje), ícones de adicionar, foco em inputs, itens selecionados em listas.
- Em muitos temas `link` coincide com `primary`; em outros diverge para refletir a paleta do tema (ex.: One Dark usa roxo `#c678dd` para links e azul `#61afef` nos botões; Slacks UI usa `#8a74b9` nos links).

### Dica de contraste

- Temas **escuros**: `primaryForeground` costuma ser escuro (ex.: cor de `background`)
- Temas **claros**: `primaryForeground` costuma ser `#ffffff`
- Verifique legibilidade de `textPrimary` sobre `background` e `surface`

---

## 7. Como os componentes consomem o tema

Componentes usam **classes Tailwind semânticas** — nunca cores da paleta Tailwind (`bg-gray-900`, `text-white`, etc.).

| Token | Classe Tailwind |
|---|---|
| `background` | `bg-background`, `text-background` |
| `surface` | `bg-surface` |
| `surfaceSoft` | `bg-surface-soft` |
| `border` | `border-border` |
| `textPrimary` | `text-text-primary` |
| `textSecondary` | `text-text-secondary` |
| `primary` | `bg-primary` (botões sólidos) |
| `primarySoft` | `bg-primary-soft` |
| `primaryForeground` | `text-primary-foreground` |
| `link` | `text-link`, `border-link`, `focus:border-link`, `accent-link` |
| `linkSoft` | `bg-link-soft`, `hover:bg-link-soft` |
| `income` | `text-income` |
| `expense` | `text-expense` |
| `warning` | `text-warning` |
| `muted` | `text-muted` |
| `actionGradient` | `bg-action-gradient` |

### Paleta de entidades (carteiras / categorias)

Cores escolhidas pelo usuário em cadastros vivem em `theme.palette.ts` — **independente** do tema ativo. Não confundir com tokens de interface.

---

## 8. Persistência e seleção

| Aspecto | Comportamento |
|---|---|
| **Onde** | Configurações → seção **Tema** |
| **Storage** | `localStorage`, chave `fluxor:theme` |
| **Troca** | Instantânea, sem reiniciar |
| **Tema salvo removido** | Volta ao tema com `"default": true` no manifest |
| **Nenhum tema com `default`** | Usa o primeiro do catálogo (ordenado por `order`) |

---

## 9. Validação e erros comuns

O `theme.registry.ts` valida manifests em tempo de build. Erros impedem o build e indicam o problema.

| Erro | Causa | Solução |
|---|---|---|
| `pasta "X" deve coincidir com o campo "id"` | Nome da pasta ≠ `id` no JSON | Alinhar pasta e campo `id` |
| `token "primary" ausente ou inválido` | Token faltando ou vazio | Preencher todos os 16 tokens |
| `Tema duplicado: "ocean"` | Dois manifests com mesmo `id` | Usar `id` único por pasta |
| Tema não aparece no seletor | Dev server não reiniciado após criar pasta | Reiniciar `make dev` |
| Tema não persiste após reload | `id` inválido ou tema removido | Verificar `id` e manifest |

---

## 10. Limitações V1

| Limitação | Descrição |
|---|---|
| **Fallback CSS** | `styles/theme.css` espelha o tema escuro antes do JS — possível flash breve se o tema padrão mudar |
| **`themeTokens` estático** | Export legado aponta para o tema `default`; imports diretos não refletem o tema ativo |
| **Sem tokens novos** | Novos conceitos (ex.: `overlay`, `destructive`) exigem alterar `types.ts` e `globals.css` |
| **Paleta de entidades** | Cores de carteira/categoria não variam com o tema |
| **Tema nativo Android** | `themes.xml` do Tauri não acompanha a troca |
| **Reinício do dev server** | Pastas novas exigem restart do Vite para o glob reescanear |

---

## 11. Referências cruzadas

| Documento / arquivo | Relação |
|---|---|
| [TECNICO.md](./TECNICO.md) | Stack e estrutura do projeto |
| `src/config/theme/themes/README.md` | Atalho para este documento |
| `src/config/theme/theme.registry.ts` | Implementação da descoberta |
| `src/config/theme/types.ts` | Contrato TypeScript do manifest |
| `src/styles/globals.css` | Bridge Tailwind ↔ CSS variables |

---

*Para adicionar um tema: crie `src/config/theme/themes/<id>/manifest.json` e reinicie o dev server.*
