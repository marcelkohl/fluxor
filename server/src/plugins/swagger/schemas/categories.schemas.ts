const categoryExample = {
  id: "660e8400-e29b-41d4-a716-446655440001",
  name: "Moradia",
  icon: "home",
  color: "orange",
  description: "Aluguel, condomínio e contas da casa",
  isArchived: false,
  createdAt: "2026-06-09T10:00:00.000Z",
  updatedAt: "2026-06-09T10:00:00.000Z",
  deletedAt: null,
} as const;

export const categoryResponseSchema = {
  $id: "CategoryResponse",
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    icon: { type: "string" },
    color: { type: "string" },
    description: { type: ["string", "null"] },
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
    "description",
    "isArchived",
    "createdAt",
    "updatedAt",
    "deletedAt",
  ],
  additionalProperties: false,
} as const;

export const createCategoryRequestSchema = {
  $id: "CreateCategoryRequest",
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    icon: { type: "string", minLength: 1 },
    color: { type: "string", minLength: 1 },
    description: { type: ["string", "null"] },
  },
  required: ["name", "icon", "color"],
  additionalProperties: false,
} as const;

export const updateCategoryRequestSchema = {
  $id: "UpdateCategoryRequest",
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    icon: { type: "string", minLength: 1 },
    color: { type: "string", minLength: 1 },
    description: { type: ["string", "null"] },
  },
  additionalProperties: false,
  minProperties: 1,
} as const;

export const listCategoriesResponseSchema = {
  $id: "ListCategoriesResponse",
  oneOf: [
    {
      type: "array",
      items: { $ref: "CategoryResponse#" },
    },
    {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { $ref: "CategoryResponse#" },
        },
        pagination: { $ref: "PaginationResponse#" },
      },
      required: ["items", "pagination"],
      additionalProperties: false,
    },
  ],
} as const;

const categoryIdParam = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID da categoria.",
    },
  },
  required: ["id"],
} as const;

const categoryErrorResponses = {
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
    description: "Categoria não encontrada.",
    content: {
      "application/json": {
        schema: { $ref: "ApiErrorResponse#" },
        example: {
          code: "category_not_found",
          message: "Category not found",
        },
      },
    },
  },
} as const;

export const listCategoriesRouteDoc = {
  tags: ["Categories"],
  summary: "Listar categorias ativas",
  description:
    "Retorna categorias com `deletedAt = null` e `isArchived = false`. Suporta paginação opcional via `page` e `pageSize`.",
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1 },
      pageSize: { type: "integer", minimum: 1, maximum: 100 },
    },
  },
  response: {
    200: {
      description: "Lista de categorias ativas.",
      content: {
        "application/json": {
          schema: { $ref: "ListCategoriesResponse#" },
          example: [categoryExample],
        },
      },
    },
  },
} as const;

export const getCategoryRouteDoc = {
  tags: ["Categories"],
  summary: "Obter categoria por ID",
  description:
    "Retorna categoria com `deletedAt = null` (inclui arquivadas).",
  params: categoryIdParam,
  response: {
    200: {
      description: "Categoria encontrada.",
      content: {
        "application/json": {
          schema: { $ref: "CategoryResponse#" },
          example: categoryExample,
        },
      },
    },
    404: categoryErrorResponses[404],
  },
} as const;

export const createCategoryRouteDoc = {
  tags: ["Categories"],
  summary: "Criar categoria",
  description: "Cria uma nova categoria. `name`, `icon` e `color` são obrigatórios.",
  body: { $ref: "CreateCategoryRequest#" },
  response: {
    201: {
      description: "Categoria criada.",
      content: {
        "application/json": {
          schema: { $ref: "CategoryResponse#" },
          example: categoryExample,
        },
      },
    },
    400: categoryErrorResponses[400],
  },
} as const;

export const updateCategoryRouteDoc = {
  tags: ["Categories"],
  summary: "Atualizar categoria",
  description: "Atualização parcial — pelo menos um campo deve ser enviado.",
  params: categoryIdParam,
  body: { $ref: "UpdateCategoryRequest#" },
  response: {
    200: {
      description: "Categoria atualizada.",
      content: {
        "application/json": {
          schema: { $ref: "CategoryResponse#" },
          example: categoryExample,
        },
      },
    },
    400: categoryErrorResponses[400],
    404: categoryErrorResponses[404],
  },
} as const;

export const archiveCategoryRouteDoc = {
  tags: ["Categories"],
  summary: "Arquivar categoria",
  description:
    "Arquiva a categoria (`isArchived = true`). Não remove fisicamente.",
  params: categoryIdParam,
  response: {
    200: {
      description: "Categoria arquivada.",
      content: {
        "application/json": {
          schema: { $ref: "CategoryResponse#" },
          example: { ...categoryExample, isArchived: true },
        },
      },
    },
    404: categoryErrorResponses[404],
  },
} as const;
