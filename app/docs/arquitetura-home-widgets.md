# Arquitetura da Home e dos Widgets — Fluxor

> Documentação técnica interna. Registra decisões tomadas até a etapa atual para orientar implementações futuras e evitar desvios de escopo.

**Última atualização:** junho/2026 · **Estágio:** Home integrada com persistência local ou remota + widgets modulares implementados

---

## Índice

1. [Papel da Home](#1-papel-da-home)
2. [Estrutura da Home](#2-estrutura-da-home)
3. [Cabeçalho](#3-cabeçalho)
4. [Navegação mensal](#4-navegação-mensal)
5. [Widgets](#5-widgets)
6. [Lista de registros](#6-lista-de-registros)
7. [Tema](#7-tema)
8. [Fora do escopo atual](#8-fora-do-escopo-atual)
9. [Referência de pastas](#9-referência-de-pastas)

---

## 1. Papel da Home

A **Home** é o centro operacional do Fluxor. É a tela principal do app e o ponto de partida da operação diária.

### Terminologia

- O termo oficial da interface é **Carteira**.
- Não usar "Conta/Carteira" nem "conta/carteira" em textos visíveis ou documentação nova.
- Tipos e componentes internos (ex.: `AccountWallet`) mantêm nomenclatura técnica até refatoração dedicada.

### Modelo mental

A Home **não** é uma lista genérica de transações. Ela é uma visão **contextualizada** por três eixos:

| Eixo | Descrição | Estado atual |
|---|---|---|
| **Carteira ativa** | Toda a Home opera sobre uma única carteira selecionada | `useHomeWallets` (SQLite ou Remote API) |
| **Mês selecionado** | Registros e totais respeitam o mês em exibição | Estado em `homeStateService` |
| **Filtros ativos** | Restrições adicionais sobre o que é exibido | `applyHomeFilters` sobre registros do mês |

### Decisões invariantes

- **Não existe visão "todas as carteiras".** O usuário sempre opera dentro de uma carteira ativa. Agregações cross-carteira não fazem parte do modelo.
- **Cada registro pertence a uma única carteira.** Um registro nunca aparece em duas carteiras simultaneamente.
- A Home é **mobile first** — layout pensado primeiro para telas estreitas, com `max-w-md` no shell principal.

---

## 2. Estrutura da Home

A Home é composta por quatro zonas verticais, renderizadas em `HomeView`:

```
┌─────────────────────────────────┐
│  Cabeçalho                      │  HomeHeader
├─────────────────────────────────┤
│  Navegação mensal               │  MonthNavigator
├─────────────────────────────────┤
│  Área de widgets (altura fixa)  │  WidgetCarousel
├─────────────────────────────────┤
│  Lista agrupada por data        │  RecordList → RecordGroup → RecordItem
└─────────────────────────────────┘
```

### Composição (`src/features/home/components/`)

| Componente | Responsabilidade |
|---|---|
| `HomeView.tsx` | Orquestra as quatro zonas; consome `useHomeContext` |
| `HomeHeader.tsx` | Cabeçalho com seletor, ações e botão + |
| `MonthNavigator.tsx` | Mês/ano, setas e botão de filtros |
| `WidgetCarousel.tsx` | Carrossel de widgets com altura fixa e indicadores |
| `RecordList.tsx` | Itera grupos de data |
| `RecordGroup.tsx` | Cabeçalho do dia + total diário + registros |
| `RecordItem.tsx` | Linha individual de registro |
| `AccountWalletSelector.tsx` | Seletor visual de carteira |
| `CategoryIcon.tsx` | Ícone da categoria do registro |

### Fluxo de dados

```
useHomeWallets() + useHomeFinancialRecords()
      ↓
useHomeContext()
  ├── context          → props para header, navegação, lista
  ├── widgetContext    → HomeWidgetContext para widgets
  ├── monthRecords     → registros filtrados pelo mês
  └── groupedRecords   → grupos por data (RecordList)
```

O hook `useHomeContext` (`src/features/home/hooks/useHomeContext.ts`) é o ponto central de leitura. A Home carrega dados via use cases (`resolvePersistence()`), filtra por mês e filtros ativos, e monta o contexto dos widgets **antes** de passá-lo ao carrossel.

---

## 3. Cabeçalho

**Componente:** `HomeHeader.tsx`

### Elementos

| Elemento | Componente / ícone | Estado |
|---|---|---|
| Seletor de carteira | `AccountWalletSelector` + `chevronDown` | Abre picker de carteiras (`HomeView`) |
| Notificações | `ThemeIcon notification` | Botão sem ação |
| Configurações | `ThemeIcon settings` | Navega para `/settings` |
| Novo registro | `ThemeIcon add` + gradiente de ação | Abre fluxo de novo registro |

### Seletor de carteira

- Exibe o nome da carteira ativa com seta para baixo.
- Lista carteiras carregadas via `useHomeWallets` (independente do adapter de persistência).
- Troca de carteira atualiza `homeStateService.activeAccountId`.

### Regras

- O cabeçalho é **sticky** no topo da tela.
- Ações do cabeçalho **não** devem ser implementadas fora de suas etapas dedicadas (ex.: CRUD de registro não pertence ao cabeçalho nesta fase).

---

## 4. Navegação mensal

**Componente:** `MonthNavigator.tsx`

### Layout

```
[ ← ]        Maio de 2026        [ → ] [ relatório ] [ filtros ]
```

| Elemento | Ícone | Estado |
|---|---|---|
| Mês anterior | `chevronLeft` | Atualiza `homeStateService.selectedMonth/Year` |
| Mês/ano | Texto formatado (`formatMonthYear`) | Reflete mês selecionado no estado |
| Próximo mês | `chevronRight` | Idem mês anterior |
| Relatório | `report` | Abre exportação CSV/PDF do período |
| Filtros adicionais | `filters` | Abre bottom sheet de filtros |

### Decisões

- Navegação mensal persiste em `homeStateService` e refiltra registros/widgets automaticamente.
- Filtros operam sobre `homeStateService.filters` via `applyHomeFilters`.
- Exportação usa `context.records` + resumo financeiro — sem acesso direto a SQLite nos componentes de export.

---

## 5. Widgets

### Princípios

1. **Widgets são módulos independentes** — cada um vive em sua própria pasta em `src/features/widgets/widgets/`.
2. **Widgets são independentes da persistência** — recebem apenas `HomeWidgetContext` e funcionam igualmente com SQLite ou Remote API. A Home resolve os dados via use cases; widgets não conhecem o adapter ativo.
3. **Registro centralizado** — todo widget deve ser declarado em `src/features/widgets/registry/widget-registry.ts`.
4. **Recebem `HomeWidgetContext`** — dados já processados pela Home; interface `WidgetProps { context: HomeWidgetContext }`.
5. **Isolamento de persistência** — widgets **não** acessam SQLite, repositories, use cases nem serviços de persistência.
6. **Habilitação configurável** — `enabledWidgetIds` em `homeStateService` define quais widgets aparecem no carrossel.
7. **Área com altura fixa** — `WidgetCarousel` usa `h-60`; não expandir dinamicamente por widget.
8. **Lógica interna isolada** — cálculos ficam em `*.calculations.ts` dentro da pasta do widget.

### `HomeWidgetContext`

A Home monta e entrega aos widgets um contexto pronto (`src/features/widgets/types/home-widget-context.types.ts`):

```typescript
interface HomeWidgetContext {
  walletId: string;
  selectedMonth: number;
  selectedYear: number;
  records: FinancialRecord[];       // já filtrados por mês e filtros ativos
  filters: HomeFiltersState;
  categoriesById: Record<string, Category>;
  payeesById: Record<string, Payee>;
  previousBalanceCents: number;     // saldo acumulado até o mês anterior
  navigateToDate: (date: string) => void;
}
```

`useHomeContext` produz `widgetContext` via `buildHomeWidgetContext()`. A `HomeView` injeta `navigateToDate` antes de passar ao `WidgetCarousel`.

**Widgets devem trabalhar apenas com os dados recebidos via contexto** — nunca buscar dados por conta própria.

### Registry

```typescript
// src/features/widgets/registry/widget-registry.ts
widgetRegistry: WidgetDefinition[]   // catálogo completo
getEnabledWidgets(enabledIds)       // filtra pelo estado da Home
```

IDs legados inválidos (ex.: `financial-calendar-placeholder`) são normalizados em `widget-carousel-state.ts`.

### Widgets implementados

#### Resumo Financeiro (`financial-summary`)

Pasta: `widgets/financial-summary/`

Exibe totais calculados a partir de `context.records` e `context.previousBalanceCents`:

| Métrica | Descrição |
|---|---|
| Saldo Atual | Saldo do período considerando efetivações |
| A Receber | Total de receitas pendentes |
| A Pagar | Total de despesas pendentes |
| Recebido | Receitas já efetivadas no período |
| Pago | Despesas já efetivadas no período |
| Saldo Anterior | Acumulado até o mês anterior |
| Saldo Esperado | Projeção com base em pendências |

Cálculos: `financial-summary.calculations.ts` — ignora registros `canceled`.

#### Calendário Financeiro (`financial-calendar`)

Pasta: `widgets/financial-calendar/`

Exibe visão mensal (semana SEG–DOM) com:

- receitas por dia (valores esperados);
- despesas por dia (valores esperados);
- destaque do dia atual (`isToday`);
- toque em dia com registros → `context.navigateToDate(date)` → scroll + highlight na lista da Home.

Cálculos: `financial-calendar.calculations.ts` — agrupa por `record.date`, usa `expectedAmountCents`, ignora `canceled`.

#### Valores por Categoria (`category-bars`)

Pasta: `widgets/category-bars/`

Exibe barras proporcionais do período:

- categorias presentes nos registros do mês;
- valores consolidados por `categoryId` (`Math.abs(amount)`);
- cores reais de `context.categoriesById`;
- top 6 categorias por valor.

Cálculos: `category-bars.calculations.ts`.

### Widgets registrados

| ID | Nome | Pasta |
|---|---|---|
| `financial-summary` | Resumo Financeiro | `widgets/financial-summary/` |
| `financial-calendar` | Calendário Financeiro | `widgets/financial-calendar/` |
| `category-bars` | Valores por Categoria | `widgets/category-bars/` |

### Carrossel

**Componente:** `WidgetCarousel.tsx`

- Renderiza um widget por vez.
- Bolinhas indicadoras clicáveis quando há mais de um widget habilitado.
- Estado persistido em `homeStateService` (`activeWidgetId`, `enabledWidgetIds`).
- Troca via clique nas bolinhas (swipe/gestos fora do escopo).

### Como criar novos widgets

Estrutura padrão:

```
src/features/widgets/widgets/
└── nome-widget/
    ├── NomeWidget.tsx          # componente (aceita WidgetProps)
    ├── nome-widget.calculations.ts
    ├── nome-widget.types.ts
    └── index.ts
```

Fluxo de registro:

1. Criar pasta em `src/features/widgets/widgets/<nome>/` seguindo o padrão acima.
2. Exportar componente que aceita `WidgetProps` (`context: HomeWidgetContext`).
3. Implementar cálculos em `*.calculations.ts` — **somente** a partir de `context`.
4. Registrar em `widget-registry.ts` com `id` único.
5. Adicionar `id` nos widgets habilitados padrão em `home-state.mock.ts` (ou estado equivalente).
6. **Não** alterar `WidgetCarousel` para lógica específica de um widget.
7. **Não** importar SQLite, repositories, use cases ou `resolvePersistence()` no widget.

---

## 6. Lista de registros

### Comportamento atual

- Registros **agrupados por data** via `groupRecordsByDate()` (`src/features/home/utils/group-records-by-date.ts`).
- Cada grupo exibe: data (`dd/MM`), total diário com sinal (income/expense), lista de `RecordItem`.
- **Sem colapso/expansão** de grupos — todos sempre abertos.
- **Dia atual destacado** — grupo cuja data coincide com `context.referenceDate` recebe borda e badge "Hoje" (mock: `2026-05-10`).

### Exibição de registro (`RecordItem`)

- **Um único ícone principal:** o da categoria (`CategoryIcon`).
- Título, nome da categoria, valor com sinal (+/−) e status textual.
- Cores de valor: tokens `text-income` / `text-expense`.

### Grupo futuro: "Acima da área visível"

> **Não implementar agora.**

Futuramente existirá um grupo especial para registros acima do viewport visível (scroll tracking). Esse grupo:

- Dependerá de **scroll real** e **viewport tracking** (Intersection Observer ou equivalente).
- **Não** deve ser simulado com mock estático.
- **Não** deve ser antecipado com hacks de CSS ou posicionamento fixo nesta etapa.

---

## 7. Tema

### Camada centralizada (`src/config/theme/`)

| Arquivo | Responsabilidade |
|---|---|
| `theme.tokens.ts` | Valores semânticos de cor (fonte TS) |
| `theme.icons.ts` | Mapa centralizado de ícones (`ThemeIconName`) |
| `theme.assets.ts` | Paths futuros para PNG/SVG substituíveis |
| `ThemeIcon.tsx` | Componente renderizador de ícones |
| `index.ts` | Barrel export |

### CSS

| Arquivo | Responsabilidade |
|---|---|
| `src/styles/theme.css` | CSS variables `--theme-*` |
| `src/styles/globals.css` | Mapeamento Tailwind (`bg-background`, `text-primary`, etc.) |

### Tokens semânticos disponíveis

`background` · `surface` · `surfaceSoft` · `border` · `textPrimary` · `textSecondary` · `primary` · `primarySoft` · `income` · `expense` · `warning` · `muted` · `actionGradient`

### Regras

- **Cores:** usar classes Tailwind mapeadas (`bg-surface`, `text-text-primary`, `text-income`, etc.) ou `var(--theme-*)`. Não usar hex/rgb soltos em componentes.
- **Ícones:** usar `<ThemeIcon name="..." />` com chaves de `theme.icons.ts`. Não definir SVGs inline em componentes da Home.
- **Assets futuros:** carregar via `theme.assets.ts` (`resolveThemeAsset`, `resolveCategoryIconAsset`, `shouldUseCategoryAsset`).

### Exceções aceitas (etapa atual)

| Local | Motivo |
|---|---|
| `categories.mock.ts` → `color` | Cor por categoria nos **dados mock**, não no tema UI |
| `CategoryIcon` → `style={{ color: category.color }}` | Aplica cor vinda dos dados de domínio |
| `theme.tokens.ts` + `theme.css` | Fonte canônica de valores — esperado |

---

## 8. Fora do escopo atual

Funcionalidades ainda não implementadas ou fora do escopo desta etapa:

| Item | Notas |
|---|---|
| **Adapter Remote API** | ✅ Implementado — Home opera via use cases + Remote API Adapter no modo Remoto |
| **Sync V1** | Estratégia suspensa — ver [sync-v1.md](./sync-v1.md) |
| **Anexos** | Sem upload, preview ou storage na Home |
| **Recorrência (UI)** | Infra SQLite existe; assistente de recorrência não implementado |
| **Swipe no carrossel** | Troca apenas via bolinhas |
| **Colapso de grupos** | Lista sempre expandida |
| **Grupo "Acima da área visível"** | Requer scroll tracking — etapa futura |
| **Visão "todas as carteiras"** | Decisão de produto: não existirá |
| **Widgets acessando persistência** | Proibido por arquitetura — usar apenas `HomeWidgetContext` |

---

## 9. Referência de pastas

```
src/features/home/
├── components/       # UI da Home (header, navegação, lista, carrossel)
├── hooks/            # useHomeContext, useHomeWallets, useHomeFinancialRecords
├── state/            # homeStateService — mês, filtros, widgets ativos
├── types/            # Tipos de domínio e HomeContextState
└── utils/            # Agrupamento, formatação, build-home-widget-context

src/features/widgets/
├── registry/         # widget-registry, widget-carousel-state
├── types/            # WidgetDefinition, WidgetProps, HomeWidgetContext
└── widgets/          # Um diretório por widget
    ├── financial-summary/
    ├── financial-calendar/
    └── category-bars/

src/features/export/  # Exportação CSV/PDF da Home (dados do contexto)

src/config/theme/     # Tokens, ícones, assets, ThemeIcon
src/styles/           # theme.css + globals.css
```

---

*Este documento deve ser atualizado a cada decisão arquitetural relevante sobre a Home ou os Widgets.*
