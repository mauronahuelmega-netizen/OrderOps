export type OnboardingGrantView = {
  grant_id: string;
  status: string;
  display_status: string;
  starts_at: string | null;
  ends_at: string | null;
  can_edit: boolean;
  created_at?: string;
  promoter_name?: string;
  promoter_code?: string;
  can_decide?: boolean;
  can_revoke?: boolean;
};

export type OnboardingBusinessView = {
  business_id: string;
  name: string;
  slug: string;
  can_edit: boolean;
  grants: OnboardingGrantView[];
};

export type OnboardingProductView = {
  product_id: string;
  name: string;
  description: string | null;
  category_name: string;
};

const labels: Record<string, string> = {
  pending_client: "Pendiente",
  active: "Aprobada",
  rejected: "Rechazada",
  revoked: "Revocada",
  completed: "Completada",
  expired: "Vencida"
};

export function onboardingStatusLabel(status: string) {
  return labels[status] ?? "Estado no reconocido";
}

export function formatOnboardingWhen(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires"
  }).format(new Date(value));
}
