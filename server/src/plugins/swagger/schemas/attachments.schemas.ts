const attachmentExample = {
  id: "770e8400-e29b-41d4-a716-446655440010",
  recordId: "880e8400-e29b-41d4-a716-446655440011",
  kind: "document",
  label: "Boleto",
  filename: "iptu-julho.pdf",
  mimeType: "application/pdf",
  size: 245760,
  localPath: "/pessoal/2026/julho/iptu - 1a parcela.pdf",
  createdAt: "2026-06-10T12:00:00.000Z",
  deletedAt: null,
} as const;

export const attachmentResponseSchema = {
  $id: "AttachmentResponse",
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    recordId: { type: "string", format: "uuid" },
    kind: { type: "string", enum: ["document", "receipt"] },
    label: { type: ["string", "null"] },
    filename: { type: "string" },
    mimeType: { type: "string" },
    size: { type: "integer", minimum: 0 },
    localPath: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    deletedAt: { type: ["string", "null"], format: "date-time" },
  },
  required: [
    "id",
    "recordId",
    "kind",
    "label",
    "filename",
    "mimeType",
    "size",
    "localPath",
    "createdAt",
    "deletedAt",
  ],
  additionalProperties: false,
} as const;

export const createAttachmentRequestSchema = {
  $id: "CreateAttachmentRequest",
  type: "object",
  properties: {
    recordId: { type: "string", format: "uuid" },
    kind: { type: "string", enum: ["document", "receipt"] },
    filename: { type: "string", minLength: 1 },
    mimeType: { type: "string", minLength: 1 },
    size: { type: "integer", minimum: 0 },
    localPath: { type: "string", minLength: 1 },
    label: { type: ["string", "null"] },
  },
  required: ["recordId", "kind", "filename", "mimeType", "size", "localPath"],
  additionalProperties: false,
} as const;

export const listAttachmentsResponseSchema = {
  $id: "ListAttachmentsResponse",
  type: "array",
  items: { $ref: "AttachmentResponse#" },
} as const;

const attachmentIdParam = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID do anexo.",
    },
  },
  required: ["id"],
} as const;

const recordIdParam = {
  type: "object",
  properties: {
    recordId: {
      type: "string",
      format: "uuid",
      description: "ID do registro financeiro.",
    },
  },
  required: ["recordId"],
} as const;

const attachmentErrorResponses = {
  400: {
    description: "Requisição inválida.",
    content: {
      "application/json": {
        schema: { $ref: "ApiErrorResponse#" },
        example: {
          code: "validation_error",
          message: "localPath is required",
        },
      },
    },
  },
  404: {
    description: "Anexo ou registro financeiro não encontrado.",
    content: {
      "application/json": {
        schema: { $ref: "ApiErrorResponse#" },
        examples: {
          attachment: {
            value: {
              code: "attachment_not_found",
              message: "Attachment not found",
            },
          },
          record: {
            value: {
              code: "financial_record_not_found",
              message: "Financial record not found",
            },
          },
        },
      },
    },
  },
} as const;

export const listAttachmentsByRecordRouteDoc = {
  tags: ["Attachments"],
  summary: "Listar anexos de um registro financeiro",
  description:
    "Retorna metadados de anexos ativos (`deletedAt = null`) do registro.",
  params: recordIdParam,
  response: {
    200: {
      description: "Lista de anexos do registro.",
      content: {
        "application/json": {
          schema: { $ref: "ListAttachmentsResponse#" },
          example: [attachmentExample],
        },
      },
    },
    404: attachmentErrorResponses[404],
  },
} as const;

export const createAttachmentRouteDoc = {
  tags: ["Attachments"],
  summary: "Registrar metadados de anexo",
  description:
    "Cria referência externa a um arquivo. Não faz upload nem valida existência do arquivo.",
  body: { $ref: "CreateAttachmentRequest#" },
  response: {
    201: {
      description: "Anexo registrado.",
      content: {
        "application/json": {
          schema: { $ref: "AttachmentResponse#" },
          example: attachmentExample,
        },
      },
    },
    400: attachmentErrorResponses[400],
    404: attachmentErrorResponses[404],
  },
} as const;

export const getAttachmentRouteDoc = {
  tags: ["Attachments"],
  summary: "Obter anexo por ID",
  description: "Retorna anexo ativo (`deletedAt = null`).",
  params: attachmentIdParam,
  response: {
    200: {
      description: "Anexo encontrado.",
      content: {
        "application/json": {
          schema: { $ref: "AttachmentResponse#" },
          example: attachmentExample,
        },
      },
    },
    404: attachmentErrorResponses[404],
  },
} as const;

export const removeAttachmentRouteDoc = {
  tags: ["Attachments"],
  summary: "Remover anexo (soft delete)",
  description:
    "Define `deletedAt` no anexo. Não remove arquivo externo referenciado.",
  params: attachmentIdParam,
  response: {
    200: {
      description: "Anexo removido logicamente.",
      content: {
        "application/json": {
          schema: { $ref: "AttachmentResponse#" },
          example: {
            ...attachmentExample,
            deletedAt: "2026-06-10T13:00:00.000Z",
          },
        },
      },
    },
    404: attachmentErrorResponses[404],
  },
} as const;
