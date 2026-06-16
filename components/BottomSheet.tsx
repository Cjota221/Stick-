import type { Sticker } from "@/types/sticke";

export default function BottomSheet({
  sticker,
  onClose,
  onCopy,
  onDownload,
  copyLabel,
}: {
  sticker: Sticker | null;
  onClose: () => void;
  onCopy: (sticker: Sticker) => void;
  onDownload: (sticker: Sticker) => void;
  copyLabel: string;
}) {
  if (!sticker) return null;
  return (
    <>
      <button
        type="button"
        aria-label="Fechar"
        className="fixed inset-0 z-40 bg-[rgba(26,0,0,.4)]"
        onClick={onClose}
      />
      <section className="fixed right-0 bottom-0 left-0 z-50 rounded-t-[28px] bg-[var(--st-surface)] px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 shadow-2xl sm:p-5">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--st-creme-border)] sm:hidden" />
          <p className="mb-4 text-sm font-semibold text-[var(--st-ink)]">
            {sticker.name || "Figurinha Stickê"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="st-btn-primary" onClick={() => onCopy(sticker)}>
              {copyLabel}
            </button>
            <button type="button" className="st-btn-ouro" onClick={() => onDownload(sticker)}>
              Baixar
            </button>
          </div>
          <button type="button" className="st-btn-ghost mt-2 w-full" onClick={onClose}>
            Fechar
          </button>
        </div>
      </section>
    </>
  );
}
