const recurrenceBatchExample = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  ruleDescription: "Aluguel",
  startDate: "2026-07-10",
  endDate: "2027-06-10",
  occurrenceCount: 12,
  createdAt: "2026-06-09T10:00:00.000Z",
} as const;

export const recurrenceBatchResponseSchema = {
  $id: "RecurrenceBatchResponse",
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    ruleDescription: { type: "string" },
    startDate: { type: "string", format: "date" },
    endDate: { type: ["string", "null"], format: "date" },
    occurrenceCount: { type: "integer", minimum: 1 },
    createdAt: { type: "string", format: "date-time" },
  },
  required: [
    "id",
    "ruleDescription",
    "startDate",
    "endDate",
    "occurrenceCount",
    "createdAt",
  ],
  additionalProperties: false,
} as const;

const recurrenceBatchIdParam = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
  },
  required: ["id"],
  additionalProperties: false,
} as const;

const recurrenceBatchErrorResponses = {
  404: {
    description: "Lote de recorrência não encontrado.",
    content: {
      "application/json": {
        schema: { $ref: "ApiErrorResponse#" },
        example: {
          code: "recurrence_batch_not_found",
          message: "Recurrence batch not found",
        },
      },
    },
  },
} as const;

export const getRecurrenceBatchRouteDoc = {
  tags: ["FinancialRecords"],
  summary: "Obter lote de recorrência por ID",
  description:
    "Retorna metadados do lote de registros recorrentes (rastreabilidade).",
  params: recurrenceBatchIdParam,
  response: {
    200: {
      description: "Lote encontrado.",
      content: {
        "application/json": {
          schema: { $ref: "RecurrenceBatchResponse#" },
          example: recurrenceBatchExample,
        },
      },
    },
    404: recurrenceBatchErrorResponses[404],
  },
} as const;
