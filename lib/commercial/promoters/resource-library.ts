export const RESOURCE_CATEGORIES = [
  { slug: "primer-contacto", title: "Primer contacto" },
  { slug: "presentacion", title: "Presentación de OrderOps" },
  { slug: "plan-founder", title: "Plan Founder y precios" },
  { slug: "objeciones", title: "Objeciones frecuentes" },
  { slug: "seguimiento", title: "Seguimiento" }
] as const;

export type ResourceCategorySlug = (typeof RESOURCE_CATEGORIES)[number]["slug"];

export type ResourceItem = {
  slug: string;
  category: ResourceCategorySlug;
  title: string;
  summary: string;
  kind: "guide";
  body: string;
};

const RESOURCES: ResourceItem[] = [
  {
    slug: "registrar-comercio",
    category: "primer-contacto",
    title: "Registrar un comercio en la cartera",
    summary: "Qué datos pide el alta que ya existe en el portal.",
    kind: "guide",
    body: "Registrá el comercio solo si tu cuenta puede operar.\nCompletá el nombre comercial, el WhatsApp y el rubro.\nEl alta crea la oportunidad en etapa Nueva.\nNo confirmes una atribución desde este portal."
  },
  {
    slug: "que-es-orderops",
    category: "presentacion",
    title: "Qué muestra el portal",
    summary: "Alcance de la cartera, las tareas y las liquidaciones visibles.",
    kind: "guide",
    body: "OrderOps muestra la cartera, las oportunidades, las reclamaciones y las tareas de tu cuenta.\nLas liquidaciones se consultan en Ingresos.\nLas comisiones individuales no se listan en esta lectura.\nNo afirmes un cobro, una transferencia ni una comisión que el portal no muestre."
  },
  {
    slug: "crear-tarea",
    category: "seguimiento",
    title: "Crear una tarea de seguimiento",
    summary: "Título, fecha y hora. La tarea no tiene nota propia.",
    kind: "guide",
    body: "Creá la tarea desde la oportunidad o desde la agenda.\nIndicá título, fecha y hora.\nPodés completarla, reprogramarla o cancelarla con un motivo.\nLa tarea no guarda una nota."
  }
];

export function resourceCategory(slug: string) {
  return RESOURCE_CATEGORIES.find((category) => category.slug === slug) ?? null;
}

export function resourcesInCategory(slug: ResourceCategorySlug) {
  return RESOURCES.filter((item) => item.category === slug);
}

export function findResource(slug: string) {
  return RESOURCES.find((item) => item.slug === slug) ?? null;
}

export function searchResources(query: string) {
  const normalized = query.trim().toLocaleLowerCase("es");
  if (!normalized) return [];
  return RESOURCES.filter((item) => item.title.toLocaleLowerCase("es").includes(normalized)).map((item) => ({
    slug: item.slug,
    title: item.title,
    category: resourceCategory(item.category)?.title ?? item.category
  }));
}
