"use client";

import { useState } from "react";

export default function PixBlock({
  qrCodeBase64,
  qrCode,
}: {
  qrCodeBase64: string;
  qrCode: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyPix() {
    await navigator.clipboard.writeText(qrCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-[10px] bg-[var(--st-magenta-soft)] p-4">
      {qrCodeBase64 && (
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
  );
}
