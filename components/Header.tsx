import Link from "next/link";

export default function Header() {
  return (
    <header className="relative z-30 border-b border-[var(--st-creme-border)] bg-[rgba(247,244,232,.92)] backdrop-blur-md">
      <div className="mx-auto flex h-24 max-w-[1100px] items-center justify-between px-6">
        <Link href="/" aria-label="Stickê - Página inicial">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="Stickê"
            className="h-16 w-auto object-contain sm:h-18"
          />
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium text-[var(--st-ink-mid)] sm:gap-6">
          <Link href="/acesso" className="transition hover:text-[var(--st-magenta)]">
            Já comprei
          </Link>
          {process.env.NODE_ENV === "development" && <Link href="/admin">Admin</Link>}
          <Link href="/#packs" className="st-btn-primary hidden px-5 py-2.5 sm:inline-flex">
            Ver packs
          </Link>
        </nav>
      </div>
    </header>
  );
}
