import type { FastifyPluginAsync } from "fastify";
import type {
  CreateCategoryRequest,
  EntityId,
  ListCategoriesRequest,
  UpdateCategoryRequest,
} from "@fluxor/contracts";
import {
  archiveCategoryRouteDoc,
  createCategoryRouteDoc,
  getCategoryRouteDoc,
  listCategoriesRouteDoc,
  updateCategoryRouteDoc,
} from "../plugins/swagger/index.js";
import { ArchiveCategoryUseCase } from "../categories/use-cases/archive-category.use-case.js";
import { CreateCategoryUseCase } from "../categories/use-cases/create-category.use-case.js";
import { GetCategoryUseCase } from "../categories/use-cases/get-category.use-case.js";
import { ListCategoriesUseCase } from "../categories/use-cases/list-categories.use-case.js";
import { UpdateCategoryUseCase } from "../categories/use-cases/update-category.use-case.js";

interface CategoryIdParams {
  id: EntityId;
}

export const categoriesRoute: FastifyPluginAsync = async (app) => {
  const categories = app.persistence.categories;

  const listCategories = new ListCategoriesUseCase(categories);
  const getCategory = new GetCategoryUseCase(categories);
  const createCategory = new CreateCategoryUseCase(categories);
  const updateCategory = new UpdateCategoryUseCase(categories);
  const archiveCategory = new ArchiveCategoryUseCase(categories);

  app.get(
    "/",
    { schema: listCategoriesRouteDoc },
    async (request) =>
      listCategories.execute(request.query as ListCategoriesRequest),
  );

  app.get(
    "/:id",
    { schema: getCategoryRouteDoc },
    async (request) =>
      getCategory.execute((request.params as CategoryIdParams).id),
  );

  app.post(
    "/",
    { schema: createCategoryRouteDoc },
    async (request, reply) => {
      const category = await createCategory.execute(
        request.body as CreateCategoryRequest,
      );
      return reply.status(201).send(category);
    },
  );

  app.put(
    "/:id",
    { schema: updateCategoryRouteDoc },
    async (request) => {
      const { id } = request.params as CategoryIdParams;
      return updateCategory.execute(id, request.body as UpdateCategoryRequest);
    },
  );

  app.delete(
    "/:id",
    { schema: archiveCategoryRouteDoc },
    async (request) =>
      archiveCategory.execute((request.params as CategoryIdParams).id),
  );
};
