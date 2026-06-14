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
  {
    number: "01",
    title: "Escolha seu pack",
    text: "Encontre as figurinhas que combinam com a sua marca e com o seu jeito de vender.",
  },
  {
    number: "02",
    title: "Pague uma vez",
    text: "Finalize com PIX e receba seu código assim que o pagamento for aprovado.",
  },
  {
    number: "03",
    title: "Use sem limites",
    text: "Copie ou baixe cada PNG e leve direto para o Canva, Instagram ou WhatsApp.",
  },
];

const useCases = [
  ["↗", "Stories que vendem", "Avise sobre lançamentos, últimas unidades, agenda aberta e promoções."],
  ["♡", "Atendimento mais seu", "Deixe as conversas no WhatsApp bonitas, humanas e com personalidade."],
  ["✦", "Conteúdo sem travar", "Tenha frases prontas para criar posts rápidos mesmo nos dias corridos."],
  ["S", "Marca reconhecível", "Repita seu estilo visual e faça sua cliente lembrar de você."],
];

const faqs = [
  ["Preciso instalar algum aplicativo?", "Não. Você acessa sua galeria pelo navegador do celular ou computador."],
  ["As figurinhas têm fundo transparente?", "Sim. Os arquivos são PNG e entram limpos nas suas artes, stories e mensagens."],
  ["O acesso expira?", "Não. Guarde seu código e volte à sua galeria sempre que precisar."],
  ["Posso usar no Canva e no Instagram?", "Sim. Você pode baixar a imagem ou copiar e colar nos aplicativos compatíveis."],
];

function StickerPreview({ text, className }: { text: string; className: string }) {
  return <div className={`landing-sticker ${className}`}>{text}</div>;
}

export default async function Home() {
  const packs = await getPacks();

  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <section className="landing-hero relative px-5 pb-20 pt-12 md:px-8 md:pb-28 md:pt-20">
          <div className="landing-dot landing-dot-one" />
          <div className="landing-dot landing-dot-two" />
          <div className="mx-auto grid max-w-[1120px] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative z-10 text-center lg:text-left">
              <div className="landing-kicker"><span>✦</span> Figurinhas para quem empreende</div>
              <h1 className="font-bebas mt-6 text-[68px] leading-[.84] tracking-[-.02em] text-[var(--st-ink)] sm:text-[88px] lg:text-[108px]">
                Sua marca<br />
                <span className="landing-title-highlight">fala por você.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-[570px] text-[17px] leading-8 text-[var(--st-ink-mid)] lg:mx-0 lg:text-lg">
                Packs de figurinhas PNG cheios de personalidade para deixar seus
                stories, artes e conversas com cara de marca profissional.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href="#packs" className="st-btn-primary landing-main-cta">
                  Quero minhas figurinhas <span aria-hidden="true">→</span>
                </Link>
                <Link href="#como-funciona" className="landing-text-link">Ver como funciona</Link>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] font-medium text-[var(--st-ink-mid)] lg:justify-start">
                <span>✓ Pagamento por PIX</span>
                <span>✓ Acesso imediato</span>
                <span>✓ Sem mensalidade</span>
              </div>
            </div>

            <div className="landing-showcase relative mx-auto w-full max-w-[520px]">
              <div className="landing-phone">
                <div className="landing-phone-top">
                  <img src="/brand/logo.png" alt="Stickê" className="h-8 w-auto" />
                  <span>Meu pack</span>
                </div>
                <div className="landing-phone-notice">Sua galeria criativa, sempre com você ✦</div>
                <div className="grid grid-cols-3 gap-2.5 p-4">
                  {["Agenda aberta", "Eu mereço!", "Últimas vagas", "Novidade!", "Corre!", "Obrigada"].map(
                    (label, index) => (
                      <div key={label} className={`sticke-xadrez landing-mini-sticker landing-mini-${index + 1}`}>
                        {label}
                      </div>
                    ),
                  )}
                </div>
                <div className="landing-phone-home" />
              </div>
              <StickerPreview text="VOCÊ CONSEGUE!" className="landing-float-one" />
              <StickerPreview text="BORA VENDER?" className="landing-float-two" />
              <img src="/brand/c/simbolo.png" alt="" className="landing-symbol" aria-hidden="true" />
            </div>
          </div>
        </section>

        <div className="landing-marquee" aria-hidden="true">
          <div>
            <span>PNG TRANSPARENTE</span><b>✦</b><span>CANVA</span><b>✦</b>
            <span>INSTAGRAM</span><b>✦</b><span>WHATSAPP</span><b>✦</b>
            <span>DO SEU JEITO</span><b>✦</b><span>PNG TRANSPARENTE</span><b>✦</b>
            <span>CANVA</span><b>✦</b><span>INSTAGRAM</span><b>✦</b>
            <span>WHATSAPP</span><b>✦</b><span>DO SEU JEITO</span><b>✦</b>
          </div>
        </div>

        <section className="bg-white px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-[1080px]">
            <div className="mx-auto max-w-[760px] text-center">
              <span className="landing-eyebrow">Para empreendedoras reais</span>
              <h2 className="font-bebas mt-4 text-5xl leading-none sm:text-6xl">
                Seu conteúdo não precisa parecer
                <span className="text-[var(--st-magenta)]"> igual ao de todo mundo.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-[610px] text-base leading-7 text-[var(--st-ink-mid)]">
                A Stickê coloca palavras, humor e atitude na sua comunicação. É o detalhe
                que transforma uma arte simples em algo que tem a sua cara.
              </p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-2">
              {useCases.map(([icon, title, text]) => (
                <article key={title} className="landing-benefit-card">
                  <span className="landing-benefit-icon">{icon}</span>
                  <div>
                    <h3 className="font-bebas text-[28px]">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--st-ink-mid)]">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="landing-how px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-[1080px]">
            <div className="flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">
              <div>
                <span className="landing-eyebrow">Fácil de verdade</span>
                <h2 className="font-bebas mt-3 text-5xl sm:text-6xl">Escolheu. Pagou. Usou.</h2>
              </div>
              <p className="max-w-[410px] text-sm leading-6 text-[var(--st-ink-mid)]">
                Nada de arquivos confusos ou aplicativos complicados. Sua galeria fica
                organizada e pronta para usar.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <article key={step.number} className="landing-step-card">
                  <span className="landing-step-number">{step.number}</span>
                  <div className="landing-step-line" />
                  <h3 className="font-bebas mt-7 text-[30px]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--st-ink-mid)]">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="packs" className="relative scroll-mt-8 bg-white px-4 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-[1080px]">
            <div className="text-center">
              <span className="landing-eyebrow">Escolha o seu</span>
              <h2 className="font-bebas mt-3 text-6xl text-[var(--st-magenta)] sm:text-7xl">
                Packs que dão o recado
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-sm leading-6 text-[var(--st-ink-mid)]">
                Uma compra, várias possibilidades. Use quantas vezes quiser no conteúdo da sua marca.
              </p>
            </div>
            {packs.length ? (
              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packs.map((pack, index) => (
                  <article key={pack.id} className="landing-pack-card group">
                    <div className="relative overflow-hidden">
                      {index === 0 && <span className="landing-pack-badge">Favorito</span>}
                      <PackImage pack={pack} className="aspect-square h-auto w-full transition duration-500 group-hover:scale-[1.04]" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bebas text-[28px] leading-none">{pack.name}</h3>
                          <p className="mt-2 text-[13px] text-[var(--st-ink-mid)]">{pack.sticker_count} figurinhas PNG</p>
                        </div>
                        <p className="font-mono-st text-xl font-medium text-[var(--st-magenta)]">
                          R$ {pack.price.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      {pack.description && <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--st-ink-mid)]">{pack.description}</p>}
                      <Link href={`/checkout/${pack.id}`} className="st-btn-primary mt-5 w-full">Escolher este pack</Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="landing-empty-pack mt-12">
                <img src="/brand/c/simbolo.png" alt="" className="mx-auto h-24 w-auto" />
                <h3 className="font-bebas mt-5 text-3xl">A primeira coleção está chegando</h3>
                <p className="mt-2 text-sm text-[var(--st-ink-mid)]">Estamos preparando packs lindos para dar voz à sua marca.</p>
              </div>
            )}
          </div>
        </section>

        <section className="landing-manifesto px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto grid max-w-[1080px] items-center gap-12 lg:grid-cols-2">
            <div className="relative min-h-[420px]">
              <div className="landing-poster landing-poster-one">TEM NOVIDADE!</div>
              <div className="landing-poster landing-poster-two">HOJE TEM VENDA ♡</div>
              <div className="landing-poster landing-poster-three">BORA?</div>
            </div>
            <div>
              <span className="landing-eyebrow landing-eyebrow-light">Mais que decoração</span>
              <h2 className="font-bebas mt-4 text-6xl leading-[.92] text-white sm:text-7xl">
                Sua comunicação também pode ter
                <span className="text-[var(--st-ouro)]"> personalidade.</span>
              </h2>
              <p className="mt-6 max-w-[520px] text-base leading-7 text-white/75">
                Você já coloca carinho no produto, no atendimento e em cada entrega.
                Agora a sua comunicação pode carregar essa mesma energia.
              </p>
              <Link href="#packs" className="st-btn-ouro mt-8">Encontrar meu pack</Link>
            </div>
          </div>
        </section>

        <section className="bg-[var(--st-creme)] px-5 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-[840px]">
            <div className="text-center">
              <span className="landing-eyebrow">Sem dúvida escondida</span>
              <h2 className="font-bebas mt-3 text-5xl sm:text-6xl">Perguntas frequentes</h2>
            </div>
            <div className="mt-10 space-y-3">
              {faqs.map(([question, answer], index) => (
                <details key={question} className="landing-faq" open={index === 0}>
                  <summary><span>{question}</span><b>+</b></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-final-cta px-5 py-20 text-center md:px-8 md:py-28">
          <img src="/brand/c/simbolo.png" alt="" className="mx-auto h-20 w-auto" />
          <h2 className="font-bebas mx-auto mt-6 max-w-[780px] text-6xl leading-[.92] sm:text-7xl">
            Sua marca merece ser lembrada.
          </h2>
          <p className="mx-auto mt-5 max-w-[520px] text-base leading-7 text-[var(--st-ink-mid)]">
            Escolha um pack, pague uma única vez e comece a criar conteúdo com mais presença hoje.
          </p>
          <Link href="#packs" className="st-btn-primary landing-main-cta mt-8">
            Ver os packs disponíveis <span>→</span>
          </Link>
        </section>
      </main>

      <footer className="border-t border-[var(--st-creme-border)] bg-white px-6 py-8">
        <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-4 sm:flex-row">
          <img src="/brand/logo.png" alt="Stickê" className="h-10 w-auto" />
          <p className="text-center text-xs text-[var(--st-ink-mid)]">© Stickê · Figurinhas para marcas com personalidade</p>
          <Link href="/acesso" className="text-xs font-semibold text-[var(--st-magenta)]">Já comprei</Link>
        </div>
      </footer>
    </>
  );
}
