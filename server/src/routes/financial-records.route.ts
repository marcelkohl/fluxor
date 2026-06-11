import type { FastifyPluginAsync } from "fastify";
import type {
  CreateFinancialRecordRequest,
  EntityId,
  ListFinancialRecordsRequest,
  RegisterPaymentRequest,
  UpdateFinancialRecordRequest,
} from "@fluxor/contracts";
import {
  archiveFinancialRecordRouteDoc,
  createFinancialRecordRouteDoc,
  getFinancialRecordRouteDoc,
  listFinancialRecordsRouteDoc,
  listFinancialRecordHistoryRouteDoc,
  listAttachmentsByRecordRouteDoc,
  registerPaymentRouteDoc,
  revertPaymentRouteDoc,
  updateFinancialRecordRouteDoc,
} from "../plugins/swagger/index.js";
import { ListFinancialRecordHistoryUseCase } from "../financial-records/use-cases/list-financial-record-history.use-case.js";
import { ListAttachmentsByRecordUseCase } from "../attachments/use-cases/list-attachments-by-record.use-case.js";
import { ArchiveFinancialRecordUseCase } from "../financial-records/use-cases/archive-financial-record.use-case.js";
import { CreateFinancialRecordUseCase } from "../financial-records/use-cases/create-financial-record.use-case.js";
import { GetFinancialRecordUseCase } from "../financial-records/use-cases/get-financial-record.use-case.js";
import { ListFinancialRecordsUseCase } from "../financial-records/use-cases/list-financial-records.use-case.js";
import { RegisterPaymentUseCase } from "../financial-records/use-cases/register-payment.use-case.js";
import { RevertPaymentUseCase } from "../financial-records/use-cases/revert-payment.use-case.js";
import { UpdateFinancialRecordUseCase } from "../financial-records/use-cases/update-financial-record.use-case.js";

interface FinancialRecordIdParams {
  id: EntityId;
}

interface FinancialRecordAttachmentsParams {
  recordId: EntityId;
}

export const financialRecordsRoute: FastifyPluginAsync = async (app) => {
  const persistence = app.persistence;
  const records = persistence.financialRecords;

  const listRecords = new ListFinancialRecordsUseCase(records);
  const getRecord = new GetFinancialRecordUseCase(records);
  const createRecord = new CreateFinancialRecordUseCase(persistence, records);
  const updateRecord = new UpdateFinancialRecordUseCase(persistence, records);
  const archiveRecord = new ArchiveFinancialRecordUseCase(records);
  const registerPayment = new RegisterPaymentUseCase(records);
  const revertPayment = new RevertPaymentUseCase(records);
  const listHistory = new ListFinancialRecordHistoryUseCase(
    records,
    persistence.financialRecordHistory,
  );
  const listAttachments = new ListAttachmentsByRecordUseCase(
    persistence.attachments,
    records,
  );

  app.get(
    "/",
    { schema: listFinancialRecordsRouteDoc },
    async (request) =>
      listRecords.execute(request.query as ListFinancialRecordsRequest),
  );

  app.get(
    "/:recordId/attachments",
    { schema: listAttachmentsByRecordRouteDoc },
    async (request) =>
      listAttachments.execute(
        (request.params as FinancialRecordAttachmentsParams).recordId,
      ),
  );

  app.get(
    "/:id/history",
    { schema: listFinancialRecordHistoryRouteDoc },
    async (request) =>
      listHistory.execute((request.params as FinancialRecordIdParams).id),
  );

  app.get(
    "/:id",
    { schema: getFinancialRecordRouteDoc },
    async (request) =>
      getRecord.execute((request.params as FinancialRecordIdParams).id),
  );

  app.post(
    "/",
    { schema: createFinancialRecordRouteDoc },
    async (request, reply) => {
      const record = await createRecord.execute(
        request.body as CreateFinancialRecordRequest,
      );
      return reply.status(201).send(record);
    },
  );

  app.put(
    "/:id",
    { schema: updateFinancialRecordRouteDoc },
    async (request) => {
      const { id } = request.params as FinancialRecordIdParams;
      return updateRecord.execute(
        id,
        request.body as UpdateFinancialRecordRequest,
      );
    },
  );

  app.post(
    "/:id/register-payment",
    { schema: registerPaymentRouteDoc },
    async (request) => {
      const { id } = request.params as FinancialRecordIdParams;
      return registerPayment.execute(
        id,
        request.body as RegisterPaymentRequest,
      );
    },
  );

  app.post(
    "/:id/revert-payment",
    { schema: revertPaymentRouteDoc },
    async (request) => {
      const { id } = request.params as FinancialRecordIdParams;
      return revertPayment.execute(id);
    },
  );

  app.delete(
    "/:id",
    { schema: archiveFinancialRecordRouteDoc },
    async (request) =>
      archiveRecord.execute((request.params as FinancialRecordIdParams).id),
  );
};
