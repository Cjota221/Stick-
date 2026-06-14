import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-[var(--st-creme-border)] bg-[var(--st-creme)]">
      <div className="mx-auto flex h-18 max-w-[1100px] items-center justify-between px-6">
        <Link href="/" aria-label="Stickê - Página inicial">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="Stickê"
            className="h-10 w-auto object-contain"
          />
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-[var(--st-ink-mid)]">
          <Link href="/acesso">Já comprei</Link>
          {process.env.NODE_ENV === "development" && <Link href="/admin">Admin</Link>}
        </nav>
      </div>
    </header>
  );
}
