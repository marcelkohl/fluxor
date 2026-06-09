import type { ThemeIconName } from "@/config/theme";
import {
  CATEGORY_QUICK_DEFAULT_COLOR,
  CATEGORY_QUICK_DEFAULT_ICON,
} from "@/features/categories/domain/category.defaults";
import {
  themeColorPalette,
  type ThemePaletteColor,
} from "@/config/theme/theme.palette";

/** Par [id, label PT] — ordem define a exibição no picker. */
const CATEGORY_ICON_ENTRIES = [
  // Receitas
  ["categoryIncome", "Receita"],
  ["categorySalary", "Salário"],
  ["categoryBonus", "Bônus"],
  ["categoryCommission", "Comissão"],
  ["categoryDividend", "Dividendo"],
  ["categoryRentIncome", "Aluguel recebido"],
  ["categoryInvestmentReturn", "Retorno de investimento"],
  ["categoryGift", "Presente"],
  ["categoryRefund", "Reembolso"],
  ["categorySale", "Venda"],
  // Moradia
  ["categoryHome", "Moradia"],
  ["categoryApartment", "Apartamento"],
  ["categoryHouse", "Casa"],
  ["categoryRent", "Aluguel"],
  ["categoryCondominium", "Condomínio"],
  ["categoryMortgage", "Financiamento"],
  ["categoryFurniture", "Móveis"],
  ["categoryMaintenance", "Manutenção"],
  ["categoryCleaning", "Limpeza"],
  // Alimentação
  ["categoryFood", "Alimentação"],
  ["categoryRestaurant", "Restaurante"],
  ["categoryFastFood", "Fast food"],
  ["categoryCoffee", "Café"],
  ["categoryShoppingCart", "Supermercado"],
  ["categoryMarket", "Mercado"],
  ["categoryBakery", "Padaria"],
  ["categoryDrink", "Bebida"],
  // Transporte
  ["categoryCar", "Carro"],
  ["categoryFuel", "Combustível"],
  ["categoryParking", "Estacionamento"],
  ["categoryTaxi", "Táxi"],
  ["categoryBus", "Ônibus"],
  ["categoryTrain", "Trem"],
  ["categoryAirplane", "Avião"],
  ["categoryMotorcycle", "Moto"],
  ["categoryBike", "Bicicleta"],
  ["categoryRoad", "Pedágio"],
  // Saúde
  ["categoryHealth", "Saúde"],
  ["categoryHeart", "Coração"],
  ["categoryHospital", "Hospital"],
  ["categoryDoctor", "Médico"],
  ["categoryDentist", "Dentista"],
  ["categoryMedicine", "Medicamento"],
  ["categoryFitness", "Fitness"],
  ["categoryGym", "Academia"],
  ["categoryInsurance", "Seguro"],
  // Utilidades
  ["categoryElectricity", "Energia elétrica"],
  ["categoryWater", "Água"],
  ["categoryInternet", "Internet"],
  ["categoryPhone", "Telefone"],
  ["categoryTv", "TV"],
  ["categoryCloud", "Nuvem"],
  ["categoryUtilities", "Utilidades"],
  // Educação
  ["categoryBook", "Livro"],
  ["categorySchool", "Escola"],
  ["categoryGraduation", "Graduação"],
  ["categoryCourse", "Curso"],
  ["categoryLanguage", "Idioma"],
  ["categoryCertificate", "Certificado"],
  // Lazer
  ["categoryGame", "Jogo"],
  ["categoryMusic", "Música"],
  ["categoryMovie", "Filme"],
  ["categoryCamera", "Fotografia"],
  ["categoryBeach", "Praia"],
  ["categoryParty", "Festa"],
  ["categoryTicket", "Ingresso"],
  // Compras
  ["categoryShopping", "Compras"],
  ["categoryBag", "Sacola"],
  ["categoryClothes", "Roupas"],
  ["categoryWatch", "Relógio"],
  ["categoryJewelry", "Joias"],
  // Trabalho
  ["categoryWork", "Trabalho"],
  ["categoryOffice", "Escritório"],
  ["categoryComputer", "Computador"],
  ["categoryLaptop", "Notebook"],
  ["categoryMeeting", "Reunião"],
  ["categoryProject", "Projeto"],
  ["categoryTools", "Ferramentas"],
  ["categoryServices", "Serviços"],
  // Financeiro
  ["financeMoney", "Dinheiro"],
  ["financeCoins", "Moedas"],
  ["financeLoan", "Empréstimo"],
  ["financeTax", "Imposto"],
  ["financeInvoice", "Fatura"],
  ["financeReceipt", "Recibo"],
  ["financeCalculator", "Calculadora"],
  ["financeChart", "Gráfico"],
  ["financeTrendUp", "Alta"],
  ["financeTrendDown", "Baixa"],
  ["financeShield", "Proteção"],
  ["financeProtection", "Seguro financeiro"],
  ["financeGold", "Ouro"],
  ["financeFund", "Fundo"],
  // Documentos
  ["documentFile", "Arquivo"],
  ["documentGeneric", "Documento"],
  ["documentPdf", "PDF"],
  ["documentAttachment", "Anexo"],
  ["documentFolder", "Pasta"],
  ["documentArchive", "Arquivo morto"],
  // Transferências
  ["transferSwap", "Transferência"],
  ["transferArrowLeftRight", "Entrada e saída"],
  ["transferSend", "Envio"],
  ["transferReceive", "Recebimento"],
  ["transferExchange", "Câmbio"],
  // Pessoas / favorecidos
  ["peopleFamily", "Família"],
  ["peopleBaby", "Bebê"],
  ["peopleChildren", "Crianças"],
  ["peoplePet", "Pet"],
  ["peopleRelationship", "Relacionamento"],
  ["peopleCompany", "Empresa"],
  ["peopleStore", "Loja"],
  ["peopleProvider", "Fornecedor"],
  // Outros (legado)
  ["tag", "Etiqueta"],
  ["wallet", "Carteira"],
  ["user", "Pessoa"],
  ["users", "Pessoas"],
  ["calendar", "Calendário"],
  ["notification", "Notificação"],
  ["widgets", "Widgets"],
  ["upload", "Upload"],
] as const satisfies readonly (readonly [ThemeIconName, string])[];

/** Ícones permitidos para categorias (lista controlada). */
export const categoryIconOptions = CATEGORY_ICON_ENTRIES.map(
  ([id]) => id,
) as readonly ThemeIconName[];

export type CategoryIconOption = (typeof CATEGORY_ICON_ENTRIES)[number][0];

export const categoryIconLabels: Record<CategoryIconOption, string> =
  Object.fromEntries(CATEGORY_ICON_ENTRIES) as Record<
    CategoryIconOption,
    string
  >;

export const DEFAULT_CATEGORY_ICON: CategoryIconOption =
  CATEGORY_QUICK_DEFAULT_ICON as CategoryIconOption;
export const DEFAULT_CATEGORY_COLOR: ThemePaletteColor =
  CATEGORY_QUICK_DEFAULT_COLOR;

export { themeColorPalette as categoryColorOptions };
