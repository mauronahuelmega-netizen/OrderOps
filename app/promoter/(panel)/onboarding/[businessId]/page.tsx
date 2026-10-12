import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import type { OnboardingBusinessView, OnboardingProductView } from "@/lib/commercial/onboarding/read-model";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/commercial/onboarding-ui.module.css";
import { PromoterProductEditor } from "./editor-form";

export default async function PromoterOnboardingEditorPage({
  params
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  await requirePromoterPrincipal();
  const supabase = await createSupabaseServerClient();
  const { data: businessData } = await supabase.rpc("promoter_onboarding_businesses");
  const businesses = ((businessData ?? {}) as { businesses?: OnboardingBusinessView[] }).businesses ?? [];
  const business = businesses.find((item) => item.business_id === businessId);
  if (!business) notFound();

  const { data } = await supabase.rpc("promoter_onboarding_products", { p_business_id: businessId });
  const catalog = (data ?? null) as {
    ok?: boolean;
    commercial_error_code?: string;
    products?: OnboardingProductView[];
  } | null;

  return (
    <section className={styles.page}>
      <header className={styles.card}>
        <p><Link href="/promoter/onboarding">Volver a asistencia</Link></p>
        <h1>{business.name}</h1>
        {!business.can_edit ? (
          <p role="status">No podés editar este comercio. La autorización no está vigente.</p>
        ) : null}
      </header>
      {business.can_edit && catalog?.ok ? (
        catalog.products && catalog.products.length > 0 ? (
          <ul className={styles.list}>
            {catalog.products.map((product) => (
              <li key={product.product_id} className={styles.card}>
                <p className={styles.muted}>{product.category_name}</p>
                <PromoterProductEditor
                  businessId={businessId}
                  productId={product.product_id}
                  name={product.name}
                  description={product.description ?? ""}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.card}>Este comercio no tiene productos.</p>
        )
      ) : null}
      {business.can_edit && catalog && !catalog.ok ? (
        <p className={styles.error} role="alert">No pudimos abrir el catálogo autorizado.</p>
      ) : null}
    </section>
  );
}
