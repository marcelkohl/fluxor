import type { FastifyPluginAsync } from "fastify";
import type {
  CreateWalletRequest,
  EntityId,
  ListWalletsRequest,
  UpdateWalletRequest,
} from "@fluxor/contracts";

interface WalletIdParams {
  id: EntityId;
}
import {
  archiveWalletRouteDoc,
  createWalletRouteDoc,
  getWalletRouteDoc,
  listWalletsRouteDoc,
  setDefaultWalletRouteDoc,
  updateWalletRouteDoc,
} from "../plugins/swagger/index.js";
import { ArchiveWalletUseCase } from "../wallets/use-cases/archive-wallet.use-case.js";
import { CreateWalletUseCase } from "../wallets/use-cases/create-wallet.use-case.js";
import { GetWalletUseCase } from "../wallets/use-cases/get-wallet.use-case.js";
import { ListWalletsUseCase } from "../wallets/use-cases/list-wallets.use-case.js";
import { SetDefaultWalletUseCase } from "../wallets/use-cases/set-default-wallet.use-case.js";
import { UpdateWalletUseCase } from "../wallets/use-cases/update-wallet.use-case.js";

export const walletsRoute: FastifyPluginAsync = async (app) => {
  const wallets = app.persistence.wallets;

  const listWallets = new ListWalletsUseCase(wallets);
  const getWallet = new GetWalletUseCase(wallets);
  const createWallet = new CreateWalletUseCase(wallets);
  const updateWallet = new UpdateWalletUseCase(wallets);
  const setDefaultWallet = new SetDefaultWalletUseCase(wallets);
  const archiveWallet = new ArchiveWalletUseCase(wallets);

  app.get(
    "/",
    { schema: listWalletsRouteDoc },
    async (request) => listWallets.execute(request.query as ListWalletsRequest),
  );

  app.get(
    "/:id",
    { schema: getWalletRouteDoc },
    async (request) =>
      getWallet.execute((request.params as WalletIdParams).id),
  );

  app.post(
    "/",
    { schema: createWalletRouteDoc },
    async (request, reply) => {
      const wallet = await createWallet.execute(
        request.body as CreateWalletRequest,
      );
      return reply.status(201).send(wallet);
    },
  );

  app.put(
    "/:id",
    { schema: updateWalletRouteDoc },
    async (request) => {
      const { id } = request.params as WalletIdParams;
      return updateWallet.execute(id, request.body as UpdateWalletRequest);
    },
  );

  app.post(
    "/:id/set-default",
    { schema: setDefaultWalletRouteDoc },
    async (request) =>
      setDefaultWallet.execute((request.params as WalletIdParams).id),
  );

  app.delete(
    "/:id",
    { schema: archiveWalletRouteDoc },
    async (request) =>
      archiveWallet.execute((request.params as WalletIdParams).id),
  );
};
