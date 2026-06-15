import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  return (
    <header className="relative z-30 border-b border-[var(--st-creme-border)] bg-[var(--st-header-bg)] backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1100px] items-center justify-between px-4 sm:h-32 sm:px-6">
        <Link href="/" aria-label="Stickê - Página inicial">
          <img
            src="/brand/logo.png"
            alt="Stickê"
            className="h-14 w-auto object-contain sm:h-[115px]"
          />
        </Link>
        <nav className="flex items-center gap-2 text-xs font-medium text-[var(--st-ink-mid)] sm:gap-6 sm:text-sm">
          <ThemeToggle />
          <Link href="/login" className="transition hover:text-[var(--st-magenta)]">
            Entrar
          </Link>
          {process.env.NODE_ENV === "development" && <Link href="/admin">Admin</Link>}
          <Link href="/cadastro" className="st-btn-primary hidden px-5 py-2.5 sm:inline-flex">
            Quero acesso
          </Link>
        </nav>
      </div>
    </header>
  );
}
