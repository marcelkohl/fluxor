import { useCallback, useEffect, useRef, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";

import { FormSectionHeader } from "@/components/admin-form";
import { ThemeIcon, type ThemeIconName } from "@/config/theme";
import { pickAndAttachFileToRecord } from "@/features/document-storage/application/pick-and-attach-file";
import { removeAttachmentCompletely } from "@/features/document-storage/application/remove-attachment-with-storage";
import { DesktopOnlyStorageError } from "@/features/document-storage/errors/desktop-only-storage.error";
import { DocumentStorageAccessError } from "@/features/document-storage/errors/document-storage-access.error";
import { DocumentStorageNotConfiguredError } from "@/features/document-storage/errors/document-storage-not-configured.error";
import { StorageProviderValidationError } from "@/features/document-storage/errors/storage-provider-validation.error";
import {
  ATTACH_UNSAVED_RECORD_MESSAGE,
  type AttachmentOperationState,
} from "@/features/document-storage/types/attachment-operation-state";
import { resolveAttachmentActionErrorMessage } from "@/features/document-storage/utils/resolve-action-error-message";
import type { Attachment, AttachmentKind } from "@/features/financial-records/domain";
import {
  formatFileSize,
  formatMimeTypeShort,
} from "@/features/financial-records/utils/format-record-details";

interface RecordAttachmentsSectionProps {
  title: string;
  kind: AttachmentKind;
  attachments: Attachment[];
  recordId: string;
  walletName: string;
  recordDescription: string;
  dueDate: string;
  onChanged: () => void;
}

type AttachmentVisualStatus = "uploading" | "done" | "failed";

interface PendingUploadRow {
  filename: string;
  status: "uploading" | "failed";
}

function getAttachmentKindColorClass(kind: AttachmentKind): string {
  return kind === "receipt" ? "text-income" : "text-warning";
}

function getAttachmentIcon(
  attachment: Pick<Attachment, "kind" | "mimeType">,
): ThemeIconName {
  if (attachment.kind === "receipt") {
    return "financeReceipt";
  }

  if (attachment.mimeType.toLowerCase() === "application/pdf") {
    return "documentPdf";
  }

  return "documentFile";
}

function getStatusBadgeConfig(status: AttachmentVisualStatus): {
  icon: ThemeIconName;
  badgeClassName: string;
  iconClassName: string;
  label: string;
} {
  switch (status) {
    case "uploading":
      return {
        icon: "upload",
        badgeClassName: "bg-warning animate-pulse",
        iconClassName: "text-background",
        label: "Enviando arquivo",
      };
    case "done":
      return {
        icon: "statusDone",
        badgeClassName: "bg-income",
        iconClassName: "text-background",
        label: "Arquivo anexado",
      };
    case "failed":
      return {
        icon: "close",
        badgeClassName: "bg-expense",
        iconClassName: "text-background",
        label: "Falha ao anexar",
      };
  }
}

function AttachmentIconWithStatus({
  attachment,
  kind,
  status,
}: {
  attachment?: Pick<Attachment, "kind" | "mimeType">;
  kind: AttachmentKind;
  status?: AttachmentVisualStatus;
}) {
  const iconAttachment = attachment ?? {
    kind,
    mimeType: "application/octet-stream",
  };
  const iconName = getAttachmentIcon(iconAttachment);
  const kindColorClass = getAttachmentKindColorClass(iconAttachment.kind);
  const badge = status ? getStatusBadgeConfig(status) : null;

  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-soft">
      <ThemeIcon
        name={iconName}
        size="sm"
        className={`${kindColorClass}${status ? " opacity-70" : ""}`}
      />
      {badge ? (
        <span
          className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-surface ${badge.badgeClassName}`}
          aria-label={badge.label}
          title={badge.label}
        >
          <ThemeIcon
            name={badge.icon}
            className={`!h-2.5 !w-2.5 ${badge.iconClassName}`}
          />
        </span>
      ) : null}
    </span>
  );
}

function AttachmentListItem({
  attachment,
  onRemove,
  removing,
  visualStatus,
}: {
  attachment: Attachment;
  onRemove: () => void;
  removing: boolean;
  visualStatus?: AttachmentVisualStatus;
}) {
  const label = attachment.label?.trim();
  const meta = `${formatFileSize(attachment.size)} · ${formatMimeTypeShort(attachment.mimeType)}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <AttachmentIconWithStatus
        attachment={attachment}
        kind={attachment.kind}
        status={visualStatus}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {attachment.filename}
        </p>
        {label ? (
          <p className="truncate text-xs text-text-secondary">{label}</p>
        ) : null}
        <p className="truncate text-[11px] text-muted">{meta}</p>
      </div>

      <button
        type="button"
        aria-label={`Remover ${attachment.filename}`}
        disabled={removing || visualStatus === "uploading"}
        onClick={onRemove}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-soft hover:text-expense disabled:opacity-50"
      >
        <ThemeIcon name="close" size="sm" />
      </button>
    </div>
  );
}

function PendingAttachmentListItem({
  pending,
  kind,
}: {
  pending: PendingUploadRow;
  kind: AttachmentKind;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <AttachmentIconWithStatus kind={kind} status={pending.status} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {pending.filename}
        </p>
      </div>
    </div>
  );
}

function RemoveAttachmentConfirm({
  attachment,
  isRemoving,
  onCancel,
  onConfirm,
}: {
  attachment: Attachment;
  isRemoving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mb-2 rounded-lg border border-border bg-surface-soft px-3 py-3">
      <p className="text-sm text-text-primary">
        Deseja realmente excluir o arquivo &ldquo;{attachment.filename}&rdquo;?
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={isRemoving}
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-soft disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={isRemoving}
          onClick={onConfirm}
          className="flex-1 rounded-lg border border-expense/40 bg-expense/10 px-3 py-2.5 text-sm font-medium text-expense transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isRemoving ? "Excluindo…" : "Confirmar"}
        </button>
      </div>
    </div>
  );
}

export function RecordAttachmentsSection({
  title,
  kind,
  attachments,
  recordId,
  walletName,
  recordDescription,
  dueDate,
  onChanged,
}: RecordAttachmentsSectionProps) {
  const [items, setItems] = useState(attachments);
  const [operationState, setOperationState] = useState<AttachmentOperationState>({
    phase: "idle",
  });
  const [pendingUpload, setPendingUpload] = useState<PendingUploadRow | null>(null);
  const [doneAttachmentIds, setDoneAttachmentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Attachment | null>(null);
  const [removeNotice, setRemoveNotice] = useState<string | null>(null);
  const [browserNotice, setBrowserNotice] = useState<string | null>(null);
  const lastPendingFilenameRef = useRef<string | null>(null);
  const isRecordSaved = recordId.trim().length > 0;
  const isBusy =
    operationState.phase === "selecting" || operationState.phase === "uploading";

  const handleOperationStateChange = useCallback(
    (state: AttachmentOperationState) => {
      if (state.pendingFilename) {
        lastPendingFilenameRef.current = state.pendingFilename;
      }
      setOperationState(state);
    },
    [],
  );

  useEffect(() => {
    setItems(attachments);
  }, [attachments]);

  useEffect(() => {
    if (operationState.phase === "uploading" && operationState.pendingFilename) {
      setPendingUpload({
        filename: operationState.pendingFilename,
        status: "uploading",
      });
      return;
    }

    if (operationState.phase === "idle" || operationState.phase === "selecting") {
      setPendingUpload(null);
    }

    if (operationState.phase === "success") {
      setPendingUpload(null);
    }
  }, [operationState]);

  useEffect(() => {
    if (doneAttachmentIds.size === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDoneAttachmentIds(new Set());
      setOperationState({ phase: "idle" });
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [doneAttachmentIds]);

  function showFailedUpload(filename: string) {
    setPendingUpload({ filename, status: "failed" });
    window.setTimeout(() => {
      setPendingUpload(null);
      setOperationState({ phase: "idle" });
    }, 3500);
  }

  async function handleAdd() {
    setBrowserNotice(null);
    setPendingUpload(null);

    if (!isRecordSaved) {
      setOperationState({
        phase: "error",
        message: ATTACH_UNSAVED_RECORD_MESSAGE,
      });
      return;
    }

    if (!isTauri()) {
      setBrowserNotice(
        "Seleção de arquivos disponível apenas no aplicativo desktop nesta etapa.",
      );
      return;
    }

    setOperationState({ phase: "idle" });
    lastPendingFilenameRef.current = null;

    try {
      const created = await pickAndAttachFileToRecord(
        {
          recordId,
          kind,
          walletName,
          recordDescription,
          dueDate,
        },
        { onStateChange: handleOperationStateChange },
      );

      if (!created) {
        return;
      }

      setPendingUpload(null);
      lastPendingFilenameRef.current = null;
      setItems((current) => [...current, created]);
      setDoneAttachmentIds(new Set([created.id]));
      setOperationState({ phase: "success" });
      onChanged();
    } catch (addError) {
      if (addError instanceof DesktopOnlyStorageError) {
        setBrowserNotice(addError.message);
        setOperationState({ phase: "idle" });
        setPendingUpload(null);
        return;
      }

      const message =
        addError instanceof DocumentStorageNotConfiguredError
          ? addError.message
          : addError instanceof DocumentStorageAccessError
            ? addError.message
            : addError instanceof StorageProviderValidationError
              ? addError.message
              : resolveAttachmentActionErrorMessage(addError);

      const failedFilename = lastPendingFilenameRef.current;
      if (failedFilename) {
        showFailedUpload(failedFilename);
      }

      setOperationState({ phase: "error", message });
    }
  }

  async function handleConfirmRemove() {
    if (!removeTarget) {
      return;
    }

    setOperationState({ phase: "idle" });
    setRemoveNotice(null);
    setRemovingId(removeTarget.id);

    try {
      const result = await removeAttachmentCompletely(removeTarget.id);

      setItems((current) =>
        current.filter((item) => item.id !== removeTarget.id),
      );
      setRemoveTarget(null);

      if (result.warning) {
        setRemoveNotice(result.warning);
      }

      onChanged();
    } catch (removeError) {
      if (removeError instanceof DocumentStorageAccessError) {
        setOperationState({ phase: "error", message: removeError.message });
        return;
      }

      setOperationState({
        phase: "error",
        message:
          removeError instanceof Error
            ? removeError.message
            : "Não foi possível remover o anexo",
      });
    } finally {
      setRemovingId(null);
    }
  }

  function handleRemoveRequest(attachment: Attachment) {
    setOperationState({ phase: "idle" });
    setPendingUpload(null);
    setRemoveNotice(null);
    setRemoveTarget(attachment);
  }

  const addLabel =
    kind === "document" ? "Adicionar documento" : "Adicionar comprovante";
  const emptyMessage =
    kind === "document"
      ? "Nenhum documento anexado."
      : "Nenhum comprovante anexado.";
  const sectionTitle =
    items.length > 0 ? `${title} (${items.length})` : title;
  const showEmptyState = items.length === 0 && !pendingUpload;

  return (
    <section>
      <FormSectionHeader
        title={sectionTitle}
        action={
          <button
            type="button"
            disabled={isBusy || !isRecordSaved}
            onClick={() => void handleAdd()}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-link transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isBusy ? "Enviando…" : addLabel}
          </button>
        }
      />

      {browserNotice ? (
        <p className="mb-2 rounded-lg border border-border bg-surface-soft px-3 py-2 text-xs text-text-secondary">
          {browserNotice}
        </p>
      ) : null}

      {removeTarget ? (
        <RemoveAttachmentConfirm
          attachment={removeTarget}
          isRemoving={removingId === removeTarget.id}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => void handleConfirmRemove()}
        />
      ) : null}

      {removeNotice ? (
        <p className="mb-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          {removeNotice}
        </p>
      ) : null}

      {operationState.phase === "error" && operationState.message ? (
        <p className="mb-2 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-xs text-expense">
          {operationState.message}
        </p>
      ) : null}

      <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface">
        {pendingUpload ? (
          <PendingAttachmentListItem pending={pendingUpload} kind={kind} />
        ) : null}

        {showEmptyState ? (
          <p className="px-4 py-3 text-sm text-text-secondary">{emptyMessage}</p>
        ) : (
          items.map((attachment) => (
            <AttachmentListItem
              key={attachment.id}
              attachment={attachment}
              removing={removingId === attachment.id}
              visualStatus={
                doneAttachmentIds.has(attachment.id) ? "done" : undefined
              }
              onRemove={() => handleRemoveRequest(attachment)}
            />
          ))
        )}
      </div>
    </section>
  );
}
