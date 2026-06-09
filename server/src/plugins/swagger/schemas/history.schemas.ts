const historyEventExample = {
  id: "990e8400-e29b-41d4-a716-446655440004",
  recordId: "880e8400-e29b-41d4-a716-446655440003",
  eventType: "payment_registered",
  description: "Pagamento de R$ 1.500,00 em 15/06/2026",
  metadata: null,
  createdAt: "2026-06-09T12:00:00.000Z",
  createdBy: null,
} as const;

export const financialRecordHistoryResponseSchema = {
  $id: "FinancialRecordHistoryResponse",
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    recordId: { type: "string", format: "uuid" },
    eventType: {
      type: "string",
      enum: [
        "record_created",
        "record_updated",
        "payment_registered",
        "payment_reverted",
        "attachment_added",
        "attachment_removed",
        "transfer_created",
        "transfer_updated",
        "alert_created",
      ],
    },
    description: { type: "string" },
    metadata: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
    createdBy: { type: ["string", "null"], format: "uuid" },
  },
  required: [
    "id",
    "recordId",
    "eventType",
    "description",
    "metadata",
    "createdAt",
    "createdBy",
  ],
  additionalProperties: false,
} as const;

export const listHistoryResponseSchema = {
  $id: "ListHistoryResponse",
  type: "array",
  items: { $ref: "FinancialRecordHistoryResponse#" },
} as const;

export const listFinancialRecordHistoryRouteDoc = {
  tags: ["FinancialRecords", "History"],
  summary: "Listar histórico do registro",
  description:
    "Retorna eventos de `financial_record_history_event` ordenados por `createdAt` ascendente.",
  params: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "ID do registro financeiro.",
      },
    },
    required: ["id"],
  },
  response: {
    200: {
      description: "Timeline de eventos do registro.",
      content: {
        "application/json": {
          schema: { $ref: "ListHistoryResponse#" },
          example: [
            {
              id: "aa0e8400-e29b-41d4-a716-446655440010",
              recordId: "880e8400-e29b-41d4-a716-446655440003",
              eventType: "record_created",
              description: "Registro criado",
              metadata: null,
              createdAt: "2026-06-09T10:00:00.000Z",
              createdBy: null,
            },
            historyEventExample,
          ],
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
  },
} as const;
