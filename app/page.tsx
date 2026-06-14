import Link from "next/link";
import Header from "@/components/Header";
import PackImage from "@/components/PackImage";
import { getSupabaseService } from "@/lib/supabase-service";
import type { Pack } from "@/types/sticke";

async function getPacks(): Promise<Pack[]> {
  try {
    const { data, error } = await getSupabaseService()
      .from("sticke_packs")
      .select("id,name,description,cover_url,price,sort_order,sticke_stickers(count)")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map((pack) => ({
      ...pack,
      price: Number(pack.price),
      sticker_count: pack.sticke_stickers?.[0]?.count ?? 0,
    }));
  } catch {
    return [];
  }
}

const steps = [
  ["01", "Compre o pack", "Pague com PIX e receba seu código de acesso na hora."],
  ["02", "Acesse a galeria", "Entre com seu código e veja todas as suas figurinhas."],
  ["03", "Copie ou baixe", "Toque na figurinha, copie ou baixe - uma por uma."],
];

export default async function Home() {
  const packs = await getPacks();
  return (
    <>
      <Header />
      <main>
        <section className="px-6 py-16 text-center md:pt-20 md:pb-15">
          <h1 className="font-bebas text-6xl leading-[.9] text-[var(--st-magenta)] md:text-7xl">
            Suas figurinhas favoritas
          </h1>
          <h2 className="font-bebas mt-3 text-3xl leading-tight md:text-4xl">
            prontas pra usar no Canva, Insta e Whats
          </h2>
          <p className="mx-auto mt-5 max-w-[480px] text-base leading-7 text-[var(--st-ink-mid)]">
            PNG com fundo transparente. Copie ou baixe uma por uma, direto no celular. Sem instalar
            nada.
          </p>
          <Link href="#packs" className="st-btn-primary mt-7">
            Ver os packs
          </Link>
        </section>

        <section className="bg-white px-6 py-15">
          <div className="mx-auto max-w-[1000px]">
            <h2 className="font-bebas text-center text-[40px]">Como funciona</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {steps.map(([number, title, text]) => (
                <article key={number} className="text-center md:text-left">
                  <span className="font-bebas text-5xl text-[var(--st-magenta)]">{number}</span>
                  <h3 className="font-bebas mt-1 text-2xl">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--st-ink-mid)]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="packs" className="scroll-mt-5 px-4 py-15 md:px-6">
          <div className="mx-auto max-w-[1000px]">
            <h2 className="font-bebas text-center text-5xl">Os packs</h2>
            {packs.length ? (
              <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
                {packs.map((pack) => (
                  <article key={pack.id} className="st-card">
                    <PackImage pack={pack} className="aspect-square h-auto w-full" />
                    <div className="p-4">
                      <h3 className="font-bebas text-[22px] leading-tight">{pack.name}</h3>
                      <p className="mt-1 text-[13px] text-[var(--st-ink-mid)]">
                        {pack.sticker_count} figurinhas PNG
                      </p>
                      <p className="font-mono-st my-3 text-xl font-medium text-[var(--st-magenta)]">
                        R$ {pack.price.toFixed(2).replace(".", ",")}
                      </p>
                      <Link href={`/checkout/${pack.id}`} className="st-btn-primary w-full px-2">
                        Quero esse pack
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-10 text-center text-[var(--st-ink-mid)]">
                Em breve novos packs. Volte em breve.
              </p>
            )}
          </div>
        </section>

        <section className="bg-[var(--st-magenta)] px-6 py-15 text-center">
          <h2 className="font-bebas text-[56px] leading-none text-[var(--st-ouro)]">
            R$ 27,00 uma vez.
          </h2>
          <p className="font-bebas mt-2 text-[28px] text-white">Sem mensalidade. Sem prazo.</p>
          <Link href="#packs" className="st-btn-ouro mt-6">
            Escolher um pack
          </Link>
        </section>
      </main>
      <footer className="bg-white p-6 text-center text-[13px] text-[var(--st-ink-mid)]">
        © Stickê · Todos os direitos reservados
      </footer>
    </>
  );
}
