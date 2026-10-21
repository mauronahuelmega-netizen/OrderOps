import Link from "next/link";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import {
  RESOURCE_CATEGORIES,
  resourceCategory,
  resourcesInCategory,
  searchResources
} from "@/lib/commercial/promoters/resource-library";
import styles from "@/components/promoter/promoter-panel.module.css";

export default async function PromoterResourcesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  await requirePromoterPrincipal();
  const params = await searchParams;
  const query = params.q ?? "";
  const category = resourceCategory(params.categoria ?? "");
  const matches = query.trim() ? searchResources(query) : [];

  return (
    <section className={styles.card}>
      <h1>Recursos</h1>
      <p className={styles.muted}>Biblioteca común para los promotores autorizados. No incluye precios ni enlaces no verificados.</p>
      <form className={styles.filters} method="get">
        <label>
          Título
          <input name="q" defaultValue={query} />
        </label>
        <button type="submit">Buscar</button>
      </form>
      {query.trim() ? (
        <section>
          <h2>Resultados</h2>
          {matches.length === 0 ? <p className={styles.muted}>No encontramos recursos con ese título</p> : null}
          <ul className={styles.list}>
            {matches.map((item) => (
              <li key={item.slug}>
                <Link href={`/promoter/resources/${item.slug}?q=${encodeURIComponent(query)}`}>{item.title}</Link>
                <p className={styles.muted}>{item.category}</p>
              </li>
            ))}
          </ul>
          <p><Link href="/promoter/resources">Limpiar búsqueda</Link></p>
        </section>
      ) : null}
      {category ? (
        <CategorySection slug={category.slug} title={category.title} back />
      ) : (
        <ul className={styles.list}>
          {RESOURCE_CATEGORIES.map((item) => (
            <li key={item.slug}>
              <Link href={`/promoter/resources?categoria=${item.slug}`}>{item.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CategorySection({ slug, title, back }: { slug: (typeof RESOURCE_CATEGORIES)[number]["slug"]; title: string; back?: boolean }) {
  const items = resourcesInCategory(slug);
  return (
    <section>
      {back ? <p><Link href="/promoter/resources">Volver a la biblioteca</Link></p> : null}
      <h2>{title}</h2>
      {slug === "plan-founder" ? (
        <p className={styles.muted}>Las condiciones económicas no se publican aquí porque no hay una lectura autorizada para verificarlas.</p>
      ) : null}
      {items.length === 0 ? <p className={styles.muted}>Todavía no hay recursos disponibles en esta categoría</p> : null}
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.slug} className={styles.row}>
            <Link href={`/promoter/resources/${item.slug}`}>{item.title}</Link>
            <p className={styles.muted}>{item.summary}</p>
            <p className={styles.muted}>Guía</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
