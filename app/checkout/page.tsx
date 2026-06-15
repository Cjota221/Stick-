import { redirect } from "next/navigation";
import Header from "@/components/Header";
import CheckoutPayment from "@/components/CheckoutPayment";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  STICKE_ACCESS_PRICE,
  STICKE_PRODUCT_DESCRIPTION,
  STICKE_PRODUCT_NAME,
} from "@/lib/product";
import { getSupabaseService } from "@/lib/supabase-service";

export default async function CheckoutPage() {
  const user = await getAuthenticatedUser();
  if (!user?.email) redirect("/login?next=/checkout");

  const { data: profile } = await getSupabaseService()
    .from("sticke_profiles")
    .select("name,lifetime_access")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.lifetime_access) redirect("/galeria");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[680px] px-4 py-12">
        <section className="st-card p-6 sm:p-8">
          <div className="mb-7 text-center">
            <img src="/brand/c/simbolo.png" alt="" className="mx-auto h-20 w-auto" />
            <h1 className="font-bebas mt-4 text-4xl">{STICKE_PRODUCT_NAME}</h1>
            <p className="mx-auto mt-2 max-w-[500px] text-sm leading-6 text-[var(--st-ink-mid)]">
              {STICKE_PRODUCT_DESCRIPTION}
            </p>
            <p className="font-mono-st mt-4 text-3xl font-medium text-[var(--st-magenta)]">
              R$ {STICKE_ACCESS_PRICE.toFixed(2).replace(".", ",")}
            </p>
            <p className="mt-1 text-xs font-medium text-[var(--st-ink-mid)]">
              Pagamento único · PIX ou cartão de crédito em 1x
            </p>
          </div>
          <CheckoutPayment email={user.email} name={profile?.name || ""} />
        </section>
      </main>
    </>
  );
}
