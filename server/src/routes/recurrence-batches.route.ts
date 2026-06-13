import type { FastifyPluginAsync } from "fastify";
import type { EntityId } from "@fluxor/contracts";
import { getRecurrenceBatchRouteDoc } from "../plugins/swagger/index.js";
import { GetRecurrenceBatchUseCase } from "../recurrence-batches/use-cases/get-recurrence-batch.use-case.js";

interface RecurrenceBatchIdParams {
  id: EntityId;
}

export const recurrenceBatchesRoute: FastifyPluginAsync = async (app) => {
  const getBatch = new GetRecurrenceBatchUseCase();

  app.get(
    "/:id",
    { schema: getRecurrenceBatchRouteDoc },
    async (request) =>
      getBatch.execute((request.params as RecurrenceBatchIdParams).id),
  );
};
