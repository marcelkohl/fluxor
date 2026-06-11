import { useState } from "react";
import { isTauri } from "@tauri-apps/api/core";

import { FormSectionHeader } from "@/components/admin-form";
import { ThemeIcon } from "@/config/theme";
import { DesktopOnlyStorageError } from "@/features/document-storage/errors/desktop-only-storage.error";
import { DocumentStorageNotConfiguredError } from "@/features/document-storage/errors/document-storage-not-configured.error";
import { pickAndAttachFileToRecord } from "@/features/document-storage/application/pick-and-attach-file";
import { removeAttachment } from "@/features/financial-records/application";
import type { Attachment, AttachmentKind } from "@/features/financial-records/domain";
import { formatFileSize } from "@/features/financial-records/utils/format-record-details";

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

function AttachmentListItem({
  attachment,
  onRemove,
  removing,
}: {
  attachment: Attachment;
  onRemove: () => void;
  removing: boolean;
}) {
  const title = attachment.label?.trim() || attachment.filename;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-text-secondary">
        <ThemeIcon name="upload" size="sm" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{title}</p>
        <p className="truncate text-xs text-text-secondary">
          {attachment.filename} · {formatFileSize(attachment.size)}
        </p>
        <p className="truncate text-[11px] text-muted">{attachment.localPath}</p>
      </div>
      <button
        type="button"
        disabled={removing}
        onClick={onRemove}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-expense transition-colors hover:bg-expense/10 disabled:opacity-50"
      >
        Remover
      </button>
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
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [browserNotice, setBrowserNotice] = useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    setBrowserNotice(null);

    if (!isTauri()) {
      setBrowserNotice(
        "Seleção de arquivos disponível apenas no aplicativo desktop nesta etapa.",
      );
      return;
    }

    setIsAdding(true);

    try {
      await pickAndAttachFileToRecord({
        recordId,
        kind,
        walletName,
        recordDescription,
        dueDate,
      });
      onChanged();
    } catch (addError) {
      if (addError instanceof DesktopOnlyStorageError) {
        setBrowserNotice(addError.message);
        return;
      }
      if (addError instanceof DocumentStorageNotConfiguredError) {
        setError(addError.message);
        return;
      }
      setError(
        addError instanceof Error
          ? addError.message
          : "Não foi possível adicionar o arquivo",
      );
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemove(attachmentId: string) {
    setError(null);
    setRemovingId(attachmentId);

    try {
      await removeAttachment(attachmentId);
      onChanged();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Não foi possível remover o anexo",
      );
    } finally {
      setRemovingId(null);
    }
  }

  const addLabel =
    kind === "document" ? "Adicionar documento" : "Adicionar comprovante";

  return (
    <section>
      <FormSectionHeader
        title={title}
        action={
          <button
            type="button"
            disabled={isAdding}
            onClick={() => void handleAdd()}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-link transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isAdding ? "Adicionando…" : addLabel}
          </button>
        }
      />

      {browserNotice ? (
        <p className="mb-2 rounded-lg border border-border bg-surface-soft px-3 py-2 text-xs text-text-secondary">
          {browserNotice}
        </p>
      ) : null}

      {error ? (
        <p className="mb-2 rounded-lg border border-expense/30 bg-expense/10 px-3 py-2 text-xs text-expense">
          {error}
        </p>
      ) : null}

      <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface">
        {attachments.length === 0 ? (
          <p className="px-4 py-3 text-sm text-text-secondary">
            {kind === "document"
              ? "Nenhum documento anexado."
              : "Nenhum comprovante anexado."}
          </p>
        ) : (
          attachments.map((attachment) => (
            <AttachmentListItem
              key={attachment.id}
              attachment={attachment}
              removing={removingId === attachment.id}
              onRemove={() => void handleRemove(attachment.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
