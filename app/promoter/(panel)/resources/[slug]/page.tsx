import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyResourceButton } from "@/components/promoter/copy-resource-button";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { findResource, resourceCategory } from "@/lib/commercial/promoters/resource-library";
import styles from "@/components/promoter/promoter-panel.module.css";

export default async function PromoterResourcePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePromoterPrincipal();
  const { slug } = await params;
  const query = (await searchParams).q ?? "";
  const resource = findResource(slug);
  if (!resource) notFound();
  const category = resourceCategory(resource.category);

  return (
    <article className={styles.card}>
      <p>
        {query ? (
          <Link href={`/promoter/resources?q=${encodeURIComponent(query)}`}>Volver a resultados</Link>
        ) : (
          <Link href={`/promoter/resources?categoria=${resource.category}`}>Volver a {category?.title ?? "la categoría"}</Link>
        )}
      </p>
      <p><Link href="/promoter/resources">Biblioteca</Link></p>
      <h1>{resource.title}</h1>
      <p className={styles.muted}>{resource.summary}</p>
      <p className={styles.muted}>Guía</p>
      <pre className={styles.pre}>{resource.body}</pre>
      <CopyResourceButton body={resource.body} />
    </article>
  );
}
