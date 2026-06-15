import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--st-creme)] px-4 py-10">
      <div className="mx-auto max-w-[460px]">
        <Link href="/" className="mb-7 flex justify-center" aria-label="Voltar para a página inicial">
          <img src="/brand/logo.png" alt="Stickê" className="h-28 w-auto object-contain" />
        </Link>
        <section className="st-card p-7 shadow-[0_18px_50px_rgba(92,48,64,.1)] sm:p-9">
          <h1 className="font-bebas text-4xl text-[var(--st-magenta)]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--st-ink-mid)]">{description}</p>
          <div className="mt-7">{children}</div>
        </section>
      </div>
    </main>
  );
}
