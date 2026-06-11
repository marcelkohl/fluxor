import type { ThemeIconName } from "@/config/theme";

export interface SettingsMenuEntry {
  id: string;
  title: string;
  subtitle: string;
  icon: ThemeIconName;
  enabled: boolean;
}

export const SETTINGS_MENU_ITEMS: SettingsMenuEntry[] = [
  {
    id: "theme",
    title: "Tema",
    subtitle: "Aparência visual do aplicativo",
    icon: "widgets",
    enabled: true,
  },
  {
    id: "attachment-sync",
    title: "Sync de Anexos e Recibos",
    subtitle: "Providers de armazenamento e sincronização",
    icon: "upload",
    enabled: true,
  },
  {
    id: "data-source",
    title: "Fonte de Dados",
    subtitle: "Local ou servidor remoto",
    icon: "download",
    enabled: true,
  },
  {
    id: "user",
    title: "Dados do Usuário",
    subtitle: "Nome, e-mail e preferências da conta",
    icon: "user",
    enabled: false,
  },
  {
    id: "wallets",
    title: "Carteiras",
    subtitle: "Adicionar, editar e remover carteiras",
    icon: "wallet",
    enabled: true,
  },
  {
    id: "payees",
    title: "Favorecidos",
    subtitle: "Gerenciar pessoas e empresas relacionadas aos registros",
    icon: "users",
    enabled: true,
  },
  {
    id: "categories",
    title: "Categorias",
    subtitle: "Criar, editar categorias e definir ícones",
    icon: "tag",
    enabled: true,
  },
  {
    id: "alerts",
    title: "Alertas",
    subtitle: "Configurar lembretes e notificações",
    icon: "notification",
    enabled: false,
  },
  {
    id: "widgets",
    title: "Widgets",
    subtitle: "Organizar os widgets exibidos na tela principal",
    icon: "widgets",
    enabled: false,
  },
  {
    id: "holidays",
    title: "Feriados",
    subtitle: "Calendários utilizados para validação de dias úteis",
    icon: "calendar",
    enabled: false,
  },
  {
    id: "backup",
    title: "Backup e Exportação",
    subtitle: "Exportar dados, importar e realizar backup das informações",
    icon: "upload",
    enabled: false,
  },
  {
    id: "about",
    title: "Sobre",
    subtitle: "Versão do aplicativo e informações legais",
    icon: "info",
    enabled: false,
  },
];

export const SETTINGS_DEV_ITEM: SettingsMenuEntry = {
  id: "dev",
  title: "Diagnóstico DEV",
  subtitle: "Informações técnicas e ferramentas de diagnóstico",
  icon: "diagnostics",
  enabled: true,
};
