import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FormFieldRow,
  FormSectionHeader,
  formatIsoDatePtBr,
  ThemeEntityAvatar,
} from "@/components/admin-form";
import { ThemeIcon, type ThemeIconName } from "@/config/theme";
import { ValidationError } from "@/features/database";
import { RecordAttachmentsSection } from "@/features/financial-records/components/RecordAttachmentsSection";
import { RegisterPaymentSheet } from "@/features/financial-records/components/RegisterPaymentSheet";
import { registerPayment, revertPayment, archiveFinancialRecord } from "@/features/financial-records/application";
import { RecurrenceScopeSheet } from "@/features/financial-records/components/RecurrenceScopeSheet";
import { useFinancialRecordDetails } from "@/features/financial-records/hooks/useFinancialRecordDetails";
import type { RecurrenceScope } from "@fluxor/contracts";
import {
  formatCentsToCurrency,
  formatDateTimePtBr,
  getStatusColorClass,
  RECORD_STATUS_LABELS,
  RECORD_TYPE_LABELS,
} from "@/features/financial-records/utils/format-record-details";

function EmptySectionMessage({ message }: { message: string }) {
  return (
    <p className="px-4 py-3 text-sm text-text-secondary">{message}</p>
  );
}

export function FinancialRecordDetailsPage() {
  const navigate = useNavigate();
  const { id: recordId } = useParams<{ id: string }>();
  const { data, isLoading, error, notFound, reload } =
    useFinancialRecordDetails(recordId);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [revertError, setRevertError] = useState<string | null>(null);
  const [archiveScopeSheetOpen, setArchiveScopeSheetOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const isPayable = data?.record.type === "payable";
  const amountColor = isPayable ? "text-expense" : "text-income";
  const amountPrefix = isPayable ? "-" : "+";
  const canRegisterPayment =
    data != null &&
    data.record.storedStatus === "pending" &&
    data.record.transferGroupId == null;
  const canRevertPayment =
    data != null &&
    data.record.storedStatus === "completed" &&
    data.record.transferGroupId == null;
  const canEdit =
    data != null &&
    data.record.storedStatus === "pending" &&
    data.record.transferGroupId == null;
  const canArchive = data != null && data.record.transferGroupId == null;
  const isRecurringRecord = Boolean(data?.record.recurrenceGroupId);

  async function performArchive(scope?: RecurrenceScope) {
    if (!recordId?.trim()) {
      setArchiveError("Registro inválido");
      return;
    }

    setIsArchiving(true);
    setArchiveError(null);

    try {
      await archiveFinancialRecord({
        recordId: recordId.trim(),
        scope,
      });
      navigate("/", {
        replace: true,
        state: { toast: "Registro removido" },
      });
    } catch (archiveFailure) {
      setArchiveError(
        archiveFailure instanceof Error
          ? archiveFailure.message
          : "Não foi possível remover o registro",
      );
    } finally {
      setIsArchiving(false);
      setArchiveScopeSheetOpen(false);
    }
  }

  function handleArchiveClick() {
    if (isRecurringRecord) {
      setArchiveScopeSheetOpen(true);
      return;
    }

    void performArchive();
  }

  async function handleArchiveScopeSelect(scope: RecurrenceScope) {
    await performArchive(scope);
  }

  async function handleRegisterPayment(input: {
    effectiveDate: string;
    effectiveAmount: number;
    paymentNote: string | null;
  }) {
    if (!recordId?.trim()) {
      throw new ValidationError("Registro inválido");
    }

    await registerPayment({
      recordId: recordId.trim(),
      effectiveDate: input.effectiveDate,
      effectiveAmount: input.effectiveAmount,
      paymentNote: input.paymentNote,
    });
    reload();
  }

  async function handleRevertPayment() {
    if (!recordId?.trim()) {
      setRevertError("Registro inválido");
      return;
    }

    setIsReverting(true);
    setRevertError(null);

    try {
      await revertPayment(recordId.trim());
      setShowRevertConfirm(false);
      reload();
    } catch (revertFailure) {
      setRevertError(
        revertFailure instanceof Error
          ? revertFailure.message
          : "Não foi possível reverter a efetivação",
      );
    } finally {
      setIsReverting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary"
        >
          <ThemeIcon name="chevronLeft" />
        </button>

        <h1 className="flex-1 text-base font-semibold text-text-primary">
          Detalhes da Conta
        </h1>

        {canEdit ? (
          <button
            type="button"
            onClick={() => navigate(`/records/${recordId}/edit`)}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-link"
          >
            Editar
          </button>
        ) : null}

        {canArchive ? (
          <button
            type="button"
            disabled={isArchiving}
            onClick={handleArchiveClick}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-expense disabled:opacity-40"
          >
            {isArchiving ? "Removendo…" : "Remover"}
          </button>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-text-secondary">
            Carregando registro…
          </p>
        ) : null}

        {!isLoading && error ? (
          <p
            className={`rounded-lg border px-3 py-2 text-sm ${
              notFound
                ? "border-border bg-surface text-text-secondary"
                : "border-warning/30 bg-warning/10 text-warning"
            }`}
          >
            {error}
          </p>
        ) : null}

        {archiveError ? (
          <p className="mb-4 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-sm text-expense">
            {archiveError}
          </p>
        ) : null}

        {!isLoading && data ? (
          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-surface p-4">
              <h2 className="text-lg font-semibold text-text-primary">
                {data.record.description}
              </h2>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">Tipo</span>
                  <span className="font-medium text-text-primary">
                    {RECORD_TYPE_LABELS[data.record.type]}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">Status</span>
                  <span
                    className={`font-medium ${getStatusColorClass(data.displayStatus)}`}
                  >
                    {RECORD_STATUS_LABELS[data.displayStatus]}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">Vencimento</span>
                  <span className="font-medium text-text-primary">
                    {formatIsoDatePtBr(data.record.dueDate)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">Valor previsto</span>
                  <span
                    className={`font-semibold tabular-nums ${amountColor}`}
                  >
                    {amountPrefix}
                    {formatCentsToCurrency(data.record.expectedAmount)}
                  </span>
                </div>

                {data.record.storedStatus === "completed" &&
                data.record.effectiveAmount != null ? (
                  <>
                    {data.record.effectiveDate ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-text-secondary">Data efetiva</span>
                        <span className="font-medium text-text-primary">
                          {formatIsoDatePtBr(data.record.effectiveDate)}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-text-secondary">Valor efetivado</span>
                      <span
                        className={`font-semibold tabular-nums ${amountColor}`}
                      >
                        {amountPrefix}
                        {formatCentsToCurrency(data.record.effectiveAmount)}
                      </span>
                    </div>
                  </>
                ) : null}

                {data.recurrenceLabel ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-secondary">Recorrência</span>
                    <span className="font-medium text-text-primary">
                      {data.recurrenceLabel}
                    </span>
                  </div>
                ) : null}
              </div>
            </section>

            <section>
              <FormSectionHeader title="Informações" />
              <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface px-4">
                <FormFieldRow
                  label="Tipo"
                  value={RECORD_TYPE_LABELS[data.record.type]}
                  showChevron={false}
                />
                <FormFieldRow
                  label="Categoria"
                  value={
                    data.category ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <ThemeEntityAvatar
                          icon={data.category.icon as ThemeIconName}
                          color={data.category.color}
                          size="sm"
                        />
                        <span className="min-w-0 truncate">
                          {data.category.name}
                        </span>
                      </span>
                    ) : (
                      "Sem categoria"
                    )
                  }
                  showChevron={false}
                />
                <FormFieldRow
                  label="Favorecido"
                  value={data.payee?.name ?? "Nenhum"}
                  showChevron={false}
                />
                <FormFieldRow
                  label="Vencimento"
                  value={formatIsoDatePtBr(data.record.dueDate)}
                  showChevron={false}
                />
                <FormFieldRow
                  label="Observação"
                  value={data.record.recordNote?.trim() || "Nenhuma"}
                  showChevron={false}
                />
                {data.record.paymentNote?.trim() ? (
                  <FormFieldRow
                    label="Obs. da efetivação"
                    value={data.record.paymentNote.trim()}
                    showChevron={false}
                  />
                ) : null}
              </div>
            </section>

            <RecordAttachmentsSection
              title="Documentos"
              kind="document"
              attachments={data.documents}
              recordId={data.record.id}
              walletName={data.wallet?.name ?? "carteira"}
              recordDescription={data.record.description}
              dueDate={data.record.dueDate}
              onChanged={reload}
            />

            <RecordAttachmentsSection
              title="Comprovantes"
              kind="receipt"
              attachments={data.receipts}
              recordId={data.record.id}
              walletName={data.wallet?.name ?? "carteira"}
              recordDescription={data.record.description}
              dueDate={data.record.dueDate}
              onChanged={reload}
            />

            <section>
              <FormSectionHeader title="Histórico" />
              <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface">
                {data.history.length === 0 ? (
                  <EmptySectionMessage message="Nenhum evento registrado." />
                ) : (
                  data.history.map((event) => (
                    <div key={event.id} className="px-4 py-3">
                      <p className="text-sm font-medium text-text-primary">
                        {event.description}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {formatDateTimePtBr(event.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      {canRegisterPayment ? (
        <div className="shrink-0 border-t border-border bg-background px-4 py-3">
          <button
            type="button"
            onClick={() => setIsPaymentSheetOpen(true)}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {isPayable ? "Registrar pagamento" : "Registrar recebimento"}
          </button>
        </div>
      ) : null}

      {canRevertPayment ? (
        <div className="shrink-0 border-t border-border bg-background px-4 py-3">
          {revertError ? (
            <p className="mb-3 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-sm text-expense">
              {revertError}
            </p>
          ) : null}

          {showRevertConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Reverter a efetivação de &ldquo;{data.record.description}&rdquo;?
                O registro voltará ao status pendente.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isReverting}
                  onClick={() => {
                    setShowRevertConfirm(false);
                    setRevertError(null);
                  }}
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-soft disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isReverting}
                  onClick={() => void handleRevertPayment()}
                  className="flex-1 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {isReverting ? "Revertendo…" : "Confirmar"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowRevertConfirm(true)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-soft"
            >
              Reverter efetivação
            </button>
          )}
        </div>
      ) : null}

      {data ? (
        <RegisterPaymentSheet
          isOpen={isPaymentSheetOpen}
          recordType={data.record.type}
          expectedAmountCents={data.record.expectedAmount}
          onConfirm={handleRegisterPayment}
          onClose={() => setIsPaymentSheetOpen(false)}
        />
      ) : null}

      <RecurrenceScopeSheet
        isOpen={archiveScopeSheetOpen}
        title="Remover"
        onSelect={(scope) => void handleArchiveScopeSelect(scope)}
        onClose={() => setArchiveScopeSheetOpen(false)}
      />
    </div>
  );
}
