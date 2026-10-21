export type DemoRequestInput = {
  contactName: string;
  tradeName: string;
  whatsapp: string;
  tradeCategory: string;
  email: string;
  needs: string;
};

export function validateDemoRequest(input: DemoRequestInput): string | null {
  if (input.contactName.trim().length === 0) return "El nombre del responsable es obligatorio.";
  if (input.tradeName.trim().length === 0) return "El nombre del comercio es obligatorio.";
  if (input.whatsapp.trim().length === 0) return "El WhatsApp es obligatorio.";
  if (input.tradeCategory.trim().length === 0) return "El rubro es obligatorio.";
  return null;
}
