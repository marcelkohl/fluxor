interface AttachmentStatusCheckProps {
  className?: string;
  title?: string;
  /** Deslocamento horizontal para sobrepor checks estilo WhatsApp. */
  overlapOffsetClassName?: string;
}

/** Check único, fundo transparente — ~42% do ícone de categoria (h-9 = 36px). */
export function AttachmentStatusCheck({
  className = "",
  title,
  overlapOffsetClassName = "",
}: AttachmentStatusCheckProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-[15px] w-[15px] shrink-0 ${overlapOffsetClassName} ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

interface AttachmentStatusChecksProps {
  hasDocument?: boolean;
  hasReceipt?: boolean;
}

export function AttachmentStatusChecks({
  hasDocument = false,
  hasReceipt = false,
}: AttachmentStatusChecksProps) {
  if (!hasDocument && !hasReceipt) {
    return null;
  }

  const both = hasDocument && hasReceipt;

  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 flex items-end"
      aria-label={[
        hasDocument ? "Com documento" : null,
        hasReceipt ? "Com comprovante" : null,
      ]
        .filter(Boolean)
        .join(", ")}
    >
      {hasDocument ? (
        <AttachmentStatusCheck
          className="text-warning"
          title={both ? undefined : "Com documento"}
          overlapOffsetClassName={both ? "relative z-0 -mr-2" : undefined}
        />
      ) : null}
      {hasReceipt ? (
        <AttachmentStatusCheck
          className="text-link"
          title={both ? undefined : "Com comprovante"}
          overlapOffsetClassName={both ? "relative z-10" : undefined}
        />
      ) : null}
    </span>
  );
}
