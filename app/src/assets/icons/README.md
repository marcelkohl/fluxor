# Ícones do Fluxor

Catálogo **plano** de ícones SVG. Todos os arquivos ficam diretamente nesta pasta — **sem subpastas**.

Descoberta automática em `src/config/theme/icon.registry.ts` via `import.meta.glob`.

## Convenção de nomes

Use **prefixos** para agrupar semanticamente:

| Prefixo | Uso |
|---|---|
| `wallet*` | Carteiras e contas |
| `category*` | Categorias de lançamento |
| `finance*` | Conceitos financeiros |
| `people*` | Favorecidos e entidades |
| `system*` | Configuração e infraestrutura |
| `document*` | Arquivos e anexos |
| `transfer*` | Transferências e movimentações |

O identificador no código é o **nome do arquivo sem `.svg`**:

```text
walletBank.svg      →  name="walletBank"
categoryFood.svg    →  name="categoryFood"
financeInvoice.svg  →  name="financeInvoice"
peopleFamily.svg    →  name="peopleFamily"
systemSearch.svg    →  name="systemSearch"
```

Ícones legados sem prefixo (`wallet`, `add`, `settings`, `tag`, …) permanecem válidos para compatibilidade.

## Formato do SVG

- `viewBox="0 0 24 24"`
- `stroke="currentColor"` — cor herdada do tema/contexto
- `fill="none"`
- `stroke-width="1.75"`, `stroke-linecap="round"`, `stroke-linejoin="round"`
- Sem cores fixas no arquivo

## Adicionar um ícone

1. Crie `prefixoNome.svg` nesta pasta (ex.: `categoryPets.svg`).
2. Siga o formato acima.
3. Para uso em carteiras/categorias, inclua o id nas listas em `wallet-options.ts` ou `category-options.ts`.
4. Reinicie o dev server se o ícone não aparecer de imediato.

## Remover um ícone

1. Apague o `.svg`.
2. Verifique se nenhum cadastro no banco ou lista de opções ainda referencia o id.

## Usar no código

```tsx
import { ThemeIcon } from "@/config/theme";

<ThemeIcon name="walletBank" size="md" />
```

Listar ícones disponíveis em runtime:

```tsx
import { knownIconNames } from "@/config/theme";
// knownIconNames — array ordenado de todos os ids
```

## Catálogo por área (referência)

### Carteiras (`wallet*`)

`walletBank`, `walletCreditCard`, `walletPiggyBank`, `walletCash`, `walletSafe`, `walletInvestment`, `walletStocks`, `walletCrypto`, `walletBriefcase`, `walletHome`, `walletCar`, `walletTravel`, `walletBusiness`

### Categorias (`category*`)

Receitas, moradia, alimentação, transporte, saúde, utilidades, educação, lazer, compras, trabalho — ver arquivos `category*.svg` nesta pasta.

### Pessoas (`people*`)

`peopleFamily`, `peopleBaby`, `peopleChildren`, `peoplePet`, `peopleRelationship`, `peopleCompany`, `peopleStore`, `peopleProvider`

### Financeiro (`finance*`)

`financeMoney`, `financeCoins`, `financeLoan`, `financeTax`, `financeInvoice`, `financeReceipt`, `financeCalculator`, `financeChart`, `financeTrendUp`, `financeTrendDown`, `financeShield`, `financeProtection`, `financeGold`, `financeFund`

### Transferências (`transfer*`)

`transferSwap`, `transferArrowLeftRight`, `transferSend`, `transferReceive`, `transferExchange`

### Documentos (`document*`)

`documentFile`, `documentGeneric`, `documentPdf`, `documentAttachment`, `documentFolder`, `documentArchive`

### Sistema (`system*`)

`systemTheme`, `systemDatabase`, `systemServer`, `systemSync`, `systemCloud`, `systemSearch`, `systemReport`
