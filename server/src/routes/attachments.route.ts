import type { FastifyPluginAsync } from "fastify";
import type { CreateAttachmentRequest, EntityId } from "@fluxor/contracts";
import {
  createAttachmentRouteDoc,
  getAttachmentRouteDoc,
  removeAttachmentRouteDoc,
} from "../plugins/swagger/index.js";
import { CreateAttachmentUseCase } from "../attachments/use-cases/create-attachment.use-case.js";
import { GetAttachmentUseCase } from "../attachments/use-cases/get-attachment.use-case.js";
import { RemoveAttachmentUseCase } from "../attachments/use-cases/remove-attachment.use-case.js";

interface AttachmentIdParams {
  id: EntityId;
}

export const attachmentsRoute: FastifyPluginAsync = async (app) => {
  const persistence = app.persistence;
  const attachments = persistence.attachments;
  const records = persistence.financialRecords;

  const createAttachment = new CreateAttachmentUseCase(
    persistence,
    attachments,
    records,
  );
  const getAttachment = new GetAttachmentUseCase(attachments);
  const removeAttachment = new RemoveAttachmentUseCase(persistence, attachments);

  app.post(
    "/",
    { schema: createAttachmentRouteDoc },
    async (request, reply) => {
      const attachment = await createAttachment.execute(
        request.body as CreateAttachmentRequest,
      );
      return reply.status(201).send(attachment);
    },
  );

  app.get(
    "/:id",
    { schema: getAttachmentRouteDoc },
    async (request) =>
      getAttachment.execute((request.params as AttachmentIdParams).id),
  );

  app.delete(
    "/:id",
    { schema: removeAttachmentRouteDoc },
    async (request) =>
      removeAttachment.execute((request.params as AttachmentIdParams).id),
  );
};
