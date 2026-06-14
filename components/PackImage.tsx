import type { Pack } from "@/types/sticke";

export default function PackImage({
  pack,
  className = "",
}: {
  pack: Pack;
  className?: string;
}) {
  return pack.cover_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={pack.cover_url} alt={`Capa do pack ${pack.name}`} className={`object-cover ${className}`} />
  ) : (
    <div className={`sticke-xadrez flex items-center justify-center p-4 text-center ${className}`}>
      <span className="font-bebas text-2xl text-[var(--st-magenta)]">Pack {pack.name}</span>
    </div>
  );
}
