export const healthResponseSchema = {
  $id: "HealthResponse",
  type: "object",
  properties: {
    ok: {
      type: "boolean",
      description: "Indica que o servidor está respondendo.",
      examples: [true],
    },
  },
  required: ["ok"],
  additionalProperties: false,
} as const;

export const healthRouteDoc = {
  tags: ["System"],
  summary: "Health check",
  description: "Verifica se o servidor HTTP está disponível.",
  response: {
    200: {
      description: "Servidor operacional.",
      content: {
        "application/json": {
          schema: { $ref: "HealthResponse#" },
          example: { ok: true },
        },
      },
    },
  },
} as const;
