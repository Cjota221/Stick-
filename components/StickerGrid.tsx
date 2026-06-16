import type { Sticker } from "@/types/sticke";

export default function StickerGrid({
  stickers,
  onSelect,
}: {
  stickers: Sticker[];
  onSelect: (sticker: Sticker) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {stickers.map((sticker) => (
        <button
          key={sticker.id}
          type="button"
          className="st-card sticke-xadrez aspect-square min-w-0 cursor-pointer"
          onClick={() => onSelect(sticker)}
          aria-label={`Abrir ${sticker.name || "figurinha"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sticker.image_url}
            alt={sticker.name || "Figurinha"}
            className="h-full w-full object-contain p-2"
          />
        </button>
      ))}
    </div>
  );
}
