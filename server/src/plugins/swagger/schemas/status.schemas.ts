export const databaseStatusSchema = {
  $id: "DatabaseStatus",
  type: "object",
  properties: {
    configured: {
      type: "boolean",
      description: "Variáveis de conexão estão definidas.",
    },
    connected: {
      type: "boolean",
      description: "Conexão ativa com o MariaDB (`SELECT 1`).",
    },
    host: {
      type: "string",
      description: "Host do banco (presente quando configurado).",
      examples: ["mariadb"],
    },
    port: {
      type: "integer",
      description: "Porta do banco (presente quando configurado).",
      examples: [3306],
    },
    name: {
      type: "string",
      description: "Nome do banco (presente quando configurado).",
      examples: ["fluxor"],
    },
  },
  required: ["configured", "connected"],
  additionalProperties: false,
} as const;

export const statusResponseSchema = {
  $id: "StatusResponse",
  type: "object",
  properties: {
    name: {
      type: "string",
      examples: ["fluxor-server"],
    },
    version: {
      type: "string",
      examples: ["0.1.0"],
    },
    status: {
      type: "string",
      examples: ["running"],
    },
    environment: {
      type: "string",
      examples: ["development"],
    },
    database: {
      $ref: "DatabaseStatus#",
    },
  },
  required: ["name", "version", "status", "environment", "database"],
  additionalProperties: false,
} as const;

export const statusRouteDoc = {
  tags: ["System"],
  summary: "Status do servidor",
  description:
    "Metadados operacionais do servidor, incluindo ambiente e conexão com o banco.",
  response: {
    200: {
      description: "Status atual do servidor.",
      content: {
        "application/json": {
          schema: { $ref: "StatusResponse#" },
          example: {
            name: "fluxor-server",
            version: "0.1.0",
            status: "running",
            environment: "development",
            database: {
              configured: true,
              connected: true,
              host: "mariadb",
              port: 3306,
              name: "fluxor",
            },
          },
        },
      },
    },
  },
} as const;
