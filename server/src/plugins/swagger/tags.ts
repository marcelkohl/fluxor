export const API_TAGS = [
  {
    name: "System",
    description: "Health check e status operacional do servidor.",
  },
  {
    name: "Wallets",
    description: "Carteiras — CRUD, padrão e arquivamento.",
  },
  {
    name: "Categories",
    description: "Categorias — CRUD e arquivamento.",
  },
  {
    name: "Payees",
    description: "Favorecidos — CRUD e arquivamento.",
  },
  {
    name: "FinancialRecords",
    description: "Registros financeiros — CRUD, efetivação e histórico.",
  },
  {
    name: "History",
    description: "Timeline de eventos dos registros financeiros.",
  },
  {
    name: "Attachments",
    description:
      "Metadados de anexos — referências externas a arquivos (sem upload).",
  },
] as const;

export type ApiTagName = (typeof API_TAGS)[number]["name"];
