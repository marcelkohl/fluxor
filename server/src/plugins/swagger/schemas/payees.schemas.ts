const payeeExample = {
  id: "770e8400-e29b-41d4-a716-446655440002",
  name: "Imobiliária Central",
  notes: "Aluguel mensal",
  isArchived: false,
  createdAt: "2026-06-09T10:00:00.000Z",
  updatedAt: "2026-06-09T10:00:00.000Z",
  deletedAt: null,
} as const;

export const payeeResponseSchema = {
  $id: "PayeeResponse",
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    notes: { type: ["string", "null"] },
    isArchived: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    deletedAt: { type: ["string", "null"], format: "date-time" },
  },
  required: [
    "id",
    "name",
    "notes",
    "isArchived",
    "createdAt",
    "updatedAt",
    "deletedAt",
  ],
  additionalProperties: false,
} as const;

export const createPayeeRequestSchema = {
  $id: "CreatePayeeRequest",
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    notes: { type: ["string", "null"] },
  },
  required: ["name"],
  additionalProperties: false,
} as const;

export const updatePayeeRequestSchema = {
  $id: "UpdatePayeeRequest",
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    notes: { type: ["string", "null"] },
  },
  additionalProperties: false,
  minProperties: 1,
} as const;

export const listPayeesResponseSchema = {
  $id: "ListPayeesResponse",
  oneOf: [
    {
      type: "array",
      items: { $ref: "PayeeResponse#" },
    },
    {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { $ref: "PayeeResponse#" },
        },
        pagination: { $ref: "PaginationResponse#" },
      },
      required: ["items", "pagination"],
      additionalProperties: false,
    },
  ],
} as const;

const payeeIdParam = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID do favorecido.",
    },
  },
  required: ["id"],
} as const;

const payeeErrorResponses = {
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
        },
      },
    },
  },
  404: {
    description: "Favorecido não encontrado.",
    content: {
      "application/json": {
        schema: { $ref: "ApiErrorResponse#" },
        example: {
          code: "payee_not_found",
          message: "Payee not found",
        },
      },
    },
  },
} as const;

export const listPayeesRouteDoc = {
  tags: ["Payees"],
  summary: "Listar favorecidos ativos",
  description:
    "Retorna favorecidos com `deletedAt = null` e `isArchived = false`. Suporta paginação opcional via `page` e `pageSize`.",
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1 },
      pageSize: { type: "integer", minimum: 1, maximum: 100 },
    },
  },
  response: {
    200: {
      description: "Lista de favorecidos ativos.",
      content: {
        "application/json": {
          schema: { $ref: "ListPayeesResponse#" },
          example: [payeeExample],
        },
      },
    },
  },
} as const;

export const getPayeeRouteDoc = {
  tags: ["Payees"],
  summary: "Obter favorecido por ID",
  description:
    "Retorna favorecido com `deletedAt = null` (inclui arquivados).",
  params: payeeIdParam,
  response: {
    200: {
      description: "Favorecido encontrado.",
      content: {
        "application/json": {
          schema: { $ref: "PayeeResponse#" },
          example: payeeExample,
        },
      },
    },
    404: payeeErrorResponses[404],
  },
} as const;

export const createPayeeRouteDoc = {
  tags: ["Payees"],
  summary: "Criar favorecido",
  description: "Cria um novo favorecido. `name` é obrigatório.",
  body: { $ref: "CreatePayeeRequest#" },
  response: {
    201: {
      description: "Favorecido criado.",
      content: {
        "application/json": {
          schema: { $ref: "PayeeResponse#" },
          example: payeeExample,
        },
      },
    },
    400: payeeErrorResponses[400],
  },
} as const;

export const updatePayeeRouteDoc = {
  tags: ["Payees"],
  summary: "Atualizar favorecido",
  description: "Atualização parcial — pelo menos um campo deve ser enviado.",
  params: payeeIdParam,
  body: { $ref: "UpdatePayeeRequest#" },
  response: {
    200: {
      description: "Favorecido atualizado.",
      content: {
        "application/json": {
          schema: { $ref: "PayeeResponse#" },
          example: payeeExample,
        },
      },
    },
    400: payeeErrorResponses[400],
    404: payeeErrorResponses[404],
  },
} as const;

export const archivePayeeRouteDoc = {
  tags: ["Payees"],
  summary: "Arquivar favorecido",
  description:
    "Arquiva o favorecido (`isArchived = true`). Não remove fisicamente.",
  params: payeeIdParam,
  response: {
    200: {
      description: "Favorecido arquivado.",
      content: {
        "application/json": {
          schema: { $ref: "PayeeResponse#" },
          example: { ...payeeExample, isArchived: true },
        },
      },
    },
    404: payeeErrorResponses[404],
  },
} as const;
