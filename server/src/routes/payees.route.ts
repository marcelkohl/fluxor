import type { FastifyPluginAsync } from "fastify";
import type {
  CreatePayeeRequest,
  EntityId,
  ListPayeesRequest,
  UpdatePayeeRequest,
} from "@fluxor/contracts";
import {
  archivePayeeRouteDoc,
  createPayeeRouteDoc,
  getPayeeRouteDoc,
  listPayeesRouteDoc,
  updatePayeeRouteDoc,
} from "../plugins/swagger/index.js";
import { ArchivePayeeUseCase } from "../payees/use-cases/archive-payee.use-case.js";
import { CreatePayeeUseCase } from "../payees/use-cases/create-payee.use-case.js";
import { GetPayeeUseCase } from "../payees/use-cases/get-payee.use-case.js";
import { ListPayeesUseCase } from "../payees/use-cases/list-payees.use-case.js";
import { UpdatePayeeUseCase } from "../payees/use-cases/update-payee.use-case.js";

interface PayeeIdParams {
  id: EntityId;
}

export const payeesRoute: FastifyPluginAsync = async (app) => {
  const payees = app.persistence.payees;

  const listPayees = new ListPayeesUseCase(payees);
  const getPayee = new GetPayeeUseCase(payees);
  const createPayee = new CreatePayeeUseCase(payees);
  const updatePayee = new UpdatePayeeUseCase(payees);
  const archivePayee = new ArchivePayeeUseCase(payees);

  app.get(
    "/",
    { schema: listPayeesRouteDoc },
    async (request) =>
      listPayees.execute(request.query as ListPayeesRequest),
  );

  app.get(
    "/:id",
    { schema: getPayeeRouteDoc },
    async (request) => getPayee.execute((request.params as PayeeIdParams).id),
  );

  app.post(
    "/",
    { schema: createPayeeRouteDoc },
    async (request, reply) => {
      const payee = await createPayee.execute(
        request.body as CreatePayeeRequest,
      );
      return reply.status(201).send(payee);
    },
  );

  app.put(
    "/:id",
    { schema: updatePayeeRouteDoc },
    async (request) => {
      const { id } = request.params as PayeeIdParams;
      return updatePayee.execute(id, request.body as UpdatePayeeRequest);
    },
  );

  app.delete(
    "/:id",
    { schema: archivePayeeRouteDoc },
    async (request) =>
      archivePayee.execute((request.params as PayeeIdParams).id),
  );
};
