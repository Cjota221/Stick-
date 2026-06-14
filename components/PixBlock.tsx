"use client";

import { useState } from "react";

export default function PixBlock({
  qrCodeBase64,
  qrCode,
  accessCode,
}: {
  qrCodeBase64: string;
  qrCode: string;
  accessCode: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyPix() {
    await navigator.clipboard.writeText(qrCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="rounded-[10px] bg-[var(--st-magenta-soft)] p-4">
        {qrCodeBase64 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code PIX"
            className="mx-auto mb-4 h-[200px] w-[200px]"
          />
        )}
        <label className="mb-2 block text-sm font-medium">PIX copia e cola</label>
        <textarea className="st-input resize-none text-xs" rows={3} readOnly value={qrCode} />
        <button type="button" className="st-btn-ghost mt-3 w-full" onClick={copyPix}>
          {copied ? "Copiado!" : "Copiar código PIX"}
        </button>
      </div>
      <div className="mt-4 rounded-[10px] border border-[var(--st-creme-border)] bg-[var(--st-ouro-soft)] p-4 text-center">
        <p className="text-[13px]">Guarde seu código de acesso:</p>
        <p className="font-mono-st my-2 text-[22px] font-medium text-[var(--st-magenta)]">
          {accessCode}
        </p>
        <p className="text-xs text-[var(--st-ink-mid)]">
          Você vai precisar dele para acessar suas figurinhas.
        </p>
      </div>
    </>
  );
}
