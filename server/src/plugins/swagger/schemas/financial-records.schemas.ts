const financialRecordExample = {
  id: "880e8400-e29b-41d4-a716-446655440003",
  walletId: "550e8400-e29b-41d4-a716-446655440000",
  type: "payable",
  description: "Aluguel junho",
  payeeId: "770e8400-e29b-41d4-a716-446655440002",
  categoryId: "660e8400-e29b-41d4-a716-446655440001",
  dueDate: "2026-06-15",
  expectedAmount: 150000,
  effectiveDate: null,
  effectiveAmount: null,
  recordNote: "Referente ao contrato",
  paymentNote: null,
  storedStatus: "pending",
  recurrenceGroupId: null,
  recurrenceIndex: null,
  alertEnabled: true,
  alertOffset: 3,
  transferGroupId: null,
  createdAt: "2026-06-09T10:00:00.000Z",
  updatedAt: "2026-06-09T10:00:00.000Z",
  deletedAt: null,
} as const;

export const financialRecordResponseSchema = {
  $id: "FinancialRecordResponse",
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    walletId: { type: "string", format: "uuid" },
    type: { type: "string", enum: ["payable", "receivable"] },
    description: { type: "string" },
    payeeId: { type: ["string", "null"], format: "uuid" },
    categoryId: { type: "string", format: "uuid" },
    dueDate: { type: "string", format: "date" },
    expectedAmount: { type: "integer" },
    effectiveDate: { type: ["string", "null"], format: "date" },
    effectiveAmount: { type: ["integer", "null"] },
    recordNote: { type: ["string", "null"] },
    paymentNote: { type: ["string", "null"] },
    storedStatus: { type: "string", enum: ["pending", "completed"] },
    recurrenceGroupId: { type: ["string", "null"], format: "uuid" },
    recurrenceIndex: { type: ["integer", "null"] },
    alertEnabled: { type: "boolean" },
    alertOffset: { type: ["integer", "null"] },
    transferGroupId: { type: ["string", "null"], format: "uuid" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    deletedAt: { type: ["string", "null"], format: "date-time" },
  },
  required: [
    "id",
    "walletId",
    "type",
    "description",
    "payeeId",
    "categoryId",
    "dueDate",
    "expectedAmount",
    "effectiveDate",
    "effectiveAmount",
    "recordNote",
    "paymentNote",
    "storedStatus",
    "recurrenceGroupId",
    "recurrenceIndex",
    "alertEnabled",
    "alertOffset",
    "transferGroupId",
    "createdAt",
    "updatedAt",
    "deletedAt",
  ],
  additionalProperties: false,
} as const;

export const createFinancialRecordRequestSchema = {
  $id: "CreateFinancialRecordRequest",
  type: "object",
  properties: {
    walletId: { type: "string", format: "uuid" },
    type: { type: "string", enum: ["payable", "receivable"] },
    description: { type: "string", minLength: 1 },
    categoryId: { type: "string", format: "uuid" },
    dueDate: { type: "string", format: "date" },
    expectedAmount: { type: "integer", minimum: 1 },
    payeeId: { type: ["string", "null"], format: "uuid" },
    recordNote: { type: ["string", "null"] },
    alertEnabled: { type: "boolean" },
    alertOffset: { type: ["integer", "null"] },
    recurrenceGroupId: { type: ["string", "null"], format: "uuid" },
    recurrenceIndex: { type: ["integer", "null"] },
    transferGroupId: { type: ["string", "null"], format: "uuid" },
    storedStatus: { type: "string", enum: ["pending", "completed"] },
    effectiveDate: { type: ["string", "null"], format: "date" },
    effectiveAmount: { type: ["integer", "null"], minimum: 1 },
    paymentNote: { type: ["string", "null"] },
  },
  required: [
    "walletId",
    "type",
    "description",
    "categoryId",
    "dueDate",
    "expectedAmount",
  ],
  additionalProperties: false,
} as const;

export const updateFinancialRecordRequestSchema = {
  $id: "UpdateFinancialRecordRequest",
  type: "object",
  properties: {
    description: { type: "string", minLength: 1 },
    categoryId: { type: "string", format: "uuid" },
    dueDate: { type: "string", format: "date" },
    expectedAmount: { type: "integer", minimum: 1 },
    payeeId: { type: ["string", "null"], format: "uuid" },
    recordNote: { type: ["string", "null"] },
    alertEnabled: { type: "boolean" },
    alertOffset: { type: ["integer", "null"] },
    transferGroupId: { type: ["string", "null"], format: "uuid" },
  },
  additionalProperties: false,
  minProperties: 1,
} as const;

export const registerPaymentRequestSchema = {
  $id: "RegisterPaymentRequest",
  type: "object",
  properties: {
    effectiveDate: { type: "string", format: "date" },
    effectiveAmount: { type: "integer", minimum: 1 },
    paymentNote: { type: ["string", "null"] },
  },
  required: ["effectiveDate", "effectiveAmount"],
  additionalProperties: false,
} as const;

export const revertPaymentRequestSchema = {
  $id: "RevertPaymentRequest",
  type: "object",
  additionalProperties: false,
} as const;

export const listFinancialRecordsResponseSchema = {
  $id: "ListFinancialRecordsResponse",
  oneOf: [
    {
      type: "array",
      items: { $ref: "FinancialRecordResponse#" },
    },
    {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { $ref: "FinancialRecordResponse#" },
        },
        pagination: { $ref: "PaginationResponse#" },
      },
      required: ["items", "pagination"],
      additionalProperties: false,
    },
  ],
} as const;

const financialRecordIdParam = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID do registro financeiro.",
    },
  },
  required: ["id"],
} as const;

const financialRecordErrorResponses = {
  400: {
    description: "Requisição inválida.",
    content: {
      "application/json": {
        schema: { $ref: "ApiErrorResponse#" },
        examples: {
          validation: {
            value: {
              code: "validation_error",
              message: "body/expectedAmount must be >= 1",
            },
          },
          invalidAmount: {
            value: {
              code: "invalid_amount",
              message: "expectedAmount must be a positive integer",
            },
          },
          invalidDate: {
            value: {
              code: "invalid_date",
              message: "dueDate must be a valid ISO date (YYYY-MM-DD)",
            },
          },
          walletNotFound: {
            value: {
              code: "wallet_not_found",
              message: "Wallet not found",
            },
          },
        },
      },
    },
  },
  404: {
    description: "Registro financeiro não encontrado.",
    content: {
      "application/json": {
        schema: { $ref: "ApiErrorResponse#" },
        example: {
          code: "financial_record_not_found",
          message: "Financial record not found",
        },
      },
    },
  },
} as const;

export const listFinancialRecordsRouteDoc = {
  tags: ["FinancialRecords"],
  summary: "Listar registros financeiros",
  description:
    "Retorna registros com `deletedAt = null`. Filtros opcionais por carteira, categoria, favorecido, tipo, status e intervalo de `dueDate`.",
  querystring: {
    type: "object",
    properties: {
      walletId: { type: "string", format: "uuid" },
      categoryId: { type: "string", format: "uuid" },
      payeeId: { type: "string", format: "uuid" },
      type: { type: "string", enum: ["payable", "receivable"] },
      status: { type: "string", enum: ["pending", "completed"] },
      startDate: { type: "string", format: "date" },
      endDate: { type: "string", format: "date" },
      page: { type: "integer", minimum: 1 },
      pageSize: { type: "integer", minimum: 1, maximum: 100 },
    },
  },
  response: {
    200: {
      description: "Lista de registros financeiros.",
      content: {
        "application/json": {
          schema: { $ref: "ListFinancialRecordsResponse#" },
          example: [financialRecordExample],
        },
      },
    },
    400: financialRecordErrorResponses[400],
  },
} as const;

export const getFinancialRecordRouteDoc = {
  tags: ["FinancialRecords"],
  summary: "Obter registro por ID",
  description: "Retorna registro com `deletedAt = null`.",
  params: financialRecordIdParam,
  response: {
    200: {
      description: "Registro encontrado.",
      content: {
        "application/json": {
          schema: { $ref: "FinancialRecordResponse#" },
          example: financialRecordExample,
        },
      },
    },
    404: financialRecordErrorResponses[404],
  },
} as const;

export const createFinancialRecordRouteDoc = {
  tags: ["FinancialRecords"],
  summary: "Criar registro financeiro",
  description:
    "Cria um registro pendente por padrão. Valida referências de carteira, categoria e favorecido.",
  body: { $ref: "CreateFinancialRecordRequest#" },
  response: {
    201: {
      description: "Registro criado.",
      content: {
        "application/json": {
          schema: { $ref: "FinancialRecordResponse#" },
          example: financialRecordExample,
        },
      },
    },
    400: financialRecordErrorResponses[400],
    404: financialRecordErrorResponses[404],
  },
} as const;

export const updateFinancialRecordRouteDoc = {
  tags: ["FinancialRecords"],
  summary: "Atualizar registro financeiro",
  description:
    "Atualização parcial. Não altera campos de efetivação (`storedStatus`, `effectiveDate`, etc.).",
  params: financialRecordIdParam,
  body: { $ref: "UpdateFinancialRecordRequest#" },
  response: {
    200: {
      description: "Registro atualizado.",
      content: {
        "application/json": {
          schema: { $ref: "FinancialRecordResponse#" },
          example: financialRecordExample,
        },
      },
    },
    400: financialRecordErrorResponses[400],
    404: financialRecordErrorResponses[404],
  },
} as const;

export const archiveFinancialRecordRouteDoc = {
  tags: ["FinancialRecords"],
  summary: "Arquivar registro financeiro",
  description:
    "Exclusão lógica — define `deletedAt`. Não remove fisicamente.",
  params: financialRecordIdParam,
  response: {
    200: {
      description: "Registro arquivado.",
      content: {
        "application/json": {
          schema: { $ref: "FinancialRecordResponse#" },
          example: {
            ...financialRecordExample,
            deletedAt: "2026-06-09T12:00:00.000Z",
          },
        },
      },
    },
    404: financialRecordErrorResponses[404],
  },
} as const;

const paymentOperationErrors = {
  400: financialRecordErrorResponses[400],
  404: financialRecordErrorResponses[404],
  409: {
    description: "Conflito de estado do registro.",
    content: {
      "application/json": {
        schema: { $ref: "ApiErrorResponse#" },
        examples: {
          alreadyCompleted: {
            value: {
              code: "financial_record_already_completed",
              message: "Record is already completed",
            },
          },
          notCompleted: {
            value: {
              code: "financial_record_not_completed",
              message: "Record is not completed",
            },
          },
        },
      },
    },
  },
} as const;

export const registerPaymentRouteDoc = {
  tags: ["FinancialRecords"],
  summary: "Efetivar registro",
  description:
    "Registra pagamento ou recebimento. Define `storedStatus = completed` e cria evento `payment_registered` no histórico. Apenas registros `pending`.",
  params: financialRecordIdParam,
  body: { $ref: "RegisterPaymentRequest#" },
  response: {
    200: {
      description: "Registro efetivado.",
      content: {
        "application/json": {
          schema: { $ref: "FinancialRecordResponse#" },
          example: {
            ...financialRecordExample,
            effectiveDate: "2026-06-15",
            effectiveAmount: 150000,
            paymentNote: "Pago via PIX",
            storedStatus: "completed",
          },
        },
      },
    },
    ...paymentOperationErrors,
  },
} as const;

export const revertPaymentRouteDoc = {
  tags: ["FinancialRecords"],
  summary: "Reverter efetivação",
  description:
    "Limpa campos de efetivação, define `storedStatus = pending` e cria evento `payment_reverted` no histórico. Apenas registros `completed`.",
  params: financialRecordIdParam,
  body: { $ref: "RevertPaymentRequest#" },
  response: {
    200: {
      description: "Efetivação revertida.",
      content: {
        "application/json": {
          schema: { $ref: "FinancialRecordResponse#" },
          example: financialRecordExample,
        },
      },
    },
    ...paymentOperationErrors,
  },
} as const;
