export type AttachmentOperationPhase =
  | "idle"
  | "selecting"
  | "uploading"
  | "success"
  | "error";

export interface AttachmentOperationState {
  phase: AttachmentOperationPhase;
  message?: string;
  pendingFilename?: string;
}

export type AttachmentOperationStateListener = (
  state: AttachmentOperationState,
) => void;

export const ATTACHMENT_UPLOADING_MESSAGE = "Enviando arquivo…";

export function attachmentSuccessMessage(kind: "document" | "receipt"): string {
  return kind === "document"
    ? "Documento anexado com sucesso."
    : "Comprovante anexado com sucesso.";
}

export const ATTACH_UNSAVED_RECORD_MESSAGE =
  "Salve o registro antes de anexar documentos.";
