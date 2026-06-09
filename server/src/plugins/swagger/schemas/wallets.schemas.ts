const walletExample = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Carteira Principal",
  icon: "wallet",
  color: "blue",
  notes: null,
  isDefault: true,
  isArchived: false,
  createdAt: "2026-06-09T10:00:00.000Z",
  updatedAt: "2026-06-09T10:00:00.000Z",
  deletedAt: null,
} as const;

export const walletResponseSchema = {
  $id: "WalletResponse",
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    icon: { type: "string" },
    color: { type: "string" },
    notes: { type: ["string", "null"] },
    isDefault: { type: "boolean" },
    isArchived: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    deletedAt: { type: ["string", "null"], format: "date-time" },
  },
  required: [
    "id",
    "name",
    "icon",
    "color",
    "notes",
    "isDefault",
    "isArchived",
    "createdAt",
    "updatedAt",
    "deletedAt",
  ],
  additionalProperties: false,
} as const;

export const createWalletRequestSchema = {
  $id: "CreateWalletRequest",
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    icon: { type: "string", minLength: 1 },
    color: { type: "string", minLength: 1 },
    notes: { type: ["string", "null"] },
    isDefault: { type: "boolean" },
  },
  required: ["name", "icon", "color"],
  additionalProperties: false,
} as const;

export const updateWalletRequestSchema = {
  $id: "UpdateWalletRequest",
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    icon: { type: "string", minLength: 1 },
    color: { type: "string", minLength: 1 },
    notes: { type: ["string", "null"] },
  },
  additionalProperties: false,
  minProperties: 1,
} as const;

export const listWalletsResponseSchema = {
  $id: "ListWalletsResponse",
  oneOf: [
    {
      type: "array",
      items: { $ref: "WalletResponse#" },
    },
    {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { $ref: "WalletResponse#" },
        },
        pagination: { $ref: "PaginationResponse#" },
      },
      required: ["items", "pagination"],
      additionalProperties: false,
    },
  ],
} as const;

export const paginationResponseSchema = {
  $id: "PaginationResponse",
  type: "object",
  properties: {
    page: { type: "integer", minimum: 1 },
    pageSize: { type: "integer", minimum: 1 },
    totalItems: { type: "integer", minimum: 0 },
    totalPages: { type: "integer", minimum: 1 },
    hasNextPage: { type: "boolean" },
    hasPreviousPage: { type: "boolean" },
  },
  required: [
    "page",
    "pageSize",
    "totalItems",
    "totalPages",
    "hasNextPage",
    "hasPreviousPage",
  ],
  additionalProperties: false,
} as const;

export const apiErrorResponseSchema = {
  $id: "ApiErrorResponse",
  type: "object",
  properties: {
    code: { type: "string" },
    message: { type: "string" },
  },
  required: ["code", "message"],
  additionalProperties: false,
} as const;

const walletIdParam = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID da carteira.",
    },
  },
  required: ["id"],
} as const;

const walletErrorResponses = {
  400: {
    description: "Requisição inválida.",
    content: {
      "application/json": {
        schema: { $ref: "ApiErrorResponse#" },
        examples: {
          validation: {
            value: {
              code: "validation_error",
              message: "body/name must NOT have fewer than 1 characters",
            },
          },
          noFields: {
            value: {
              code: "no_fields_to_update",
              message: "At least one field must be provided",
            },
          },
          archivedDefault: {
            value: {
              code: "wallet_archived_cannot_be_default",
              message: "Archived wallet cannot be default",
            },
          },
        },
      },
    },
  },
  404: {
    description: "Carteira não encontrada.",
    content: {
      "application/json": {
        schema: { $ref: "ApiErrorResponse#" },
        example: {
          code: "wallet_not_found",
          message: "Wallet not found",
        },
      },
    },
  },
} as const;

export const listWalletsRouteDoc = {
  tags: ["Wallets"],
  summary: "Listar carteiras ativas",
  description:
    "Retorna carteiras com `deletedAt = null` e `isArchived = false`. Suporta paginação opcional via `page` e `pageSize`.",
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1 },
      pageSize: { type: "integer", minimum: 1, maximum: 100 },
    },
  },
  response: {
    200: {
      description: "Lista de carteiras ativas.",
      content: {
        "application/json": {
          schema: { $ref: "ListWalletsResponse#" },
          example: [walletExample],
        },
      },
    },
  },
} as const;

export const getWalletRouteDoc = {
  tags: ["Wallets"],
  summary: "Obter carteira por ID",
  description:
    "Retorna carteira com `deletedAt = null` (inclui arquivadas).",
  params: walletIdParam,
  response: {
    200: {
      description: "Carteira encontrada.",
      content: {
        "application/json": {
          schema: { $ref: "WalletResponse#" },
          example: walletExample,
        },
      },
    },
    404: walletErrorResponses[404],
  },
} as const;

export const createWalletRouteDoc = {
  tags: ["Wallets"],
  summary: "Criar carteira",
  description: "Cria uma nova carteira. Opcionalmente define como padrão.",
  body: { $ref: "CreateWalletRequest#" },
  response: {
    201: {
      description: "Carteira criada.",
      content: {
        "application/json": {
          schema: { $ref: "WalletResponse#" },
          example: walletExample,
        },
      },
    },
    400: walletErrorResponses[400],
  },
} as const;

export const updateWalletRouteDoc = {
  tags: ["Wallets"],
  summary: "Atualizar carteira",
  description: "Atualização parcial — pelo menos um campo deve ser enviado.",
  params: walletIdParam,
  body: { $ref: "UpdateWalletRequest#" },
  response: {
    200: {
      description: "Carteira atualizada.",
      content: {
        "application/json": {
          schema: { $ref: "WalletResponse#" },
          example: walletExample,
        },
      },
    },
    400: walletErrorResponses[400],
    404: walletErrorResponses[404],
  },
} as const;

export const setDefaultWalletRouteDoc = {
  tags: ["Wallets"],
  summary: "Definir carteira padrão",
  description:
    "Define `isDefault = true` na carteira alvo e desmarca as demais ativas. Utiliza transação.",
  params: walletIdParam,
  response: {
    200: {
      description: "Carteira definida como padrão.",
      content: {
        "application/json": {
          schema: { $ref: "WalletResponse#" },
          example: { ...walletExample, isDefault: true },
        },
      },
    },
    400: walletErrorResponses[400],
    404: walletErrorResponses[404],
  },
} as const;

export const archiveWalletRouteDoc = {
  tags: ["Wallets"],
  summary: "Arquivar carteira",
  description:
    "Arquiva a carteira (`isArchived = true`). Se era padrão, remove `isDefault`. Não remove fisicamente.",
  params: walletIdParam,
  response: {
    200: {
      description: "Carteira arquivada.",
      content: {
        "application/json": {
          schema: { $ref: "WalletResponse#" },
          example: { ...walletExample, isDefault: false, isArchived: true },
        },
      },
    },
    404: walletErrorResponses[404],
  },
} as const;
