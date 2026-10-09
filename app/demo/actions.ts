"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prepareDemoRateLimitHash } from "@/lib/commercial/crm/demo-ip";
import { validateDemoRequest } from "@/lib/commercial/crm/demo-request";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function submitDemoRequest(formData: FormData): Promise<{ error: string } | void> {
  const input = {
    contactName: String(formData.get("contactName") ?? ""),
    tradeName: String(formData.get("tradeName") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    tradeCategory: String(formData.get("tradeCategory") ?? ""),
    email: String(formData.get("email") ?? ""),
    needs: String(formData.get("needs") ?? "")
  };
  const validationError = validateDemoRequest(input);
  if (validationError) return { error: validationError };

  const headerStore = await headers();
  const ipHash = prepareDemoRateLimitHash({
    vercelEnv: process.env.VERCEL,
    salt: process.env.COMMERCIAL_RATE_LIMIT_SALT,
    getHeader: (name) => headerStore.get(name)
  });
  if (!ipHash) return { error: "No se pudo enviar la solicitud." };

  let supabase;
  try {
    supabase = createSupabaseServiceClient();
  } catch {
    return { error: "No se pudo enviar la solicitud." };
  }

  const { data, error } = await supabase.rpc("submit_demo_request", {
    p_contact_name: input.contactName,
    p_trade_name: input.tradeName,
    p_whatsapp: input.whatsapp,
    p_trade_category: input.tradeCategory,
    p_email: input.email,
    p_needs: input.needs,
    p_promoter_ref: null,
    p_campaign_ref: null,
    p_idempotency_key: String(formData.get("idempotencyKey") ?? ""),
    p_ip_hash: ipHash
  });

  if (error || !data || typeof data !== "object" || !("ok" in data) || data.ok !== true) {
    const code = data && typeof data === "object" && "commercial_error_code" in data ? String(data.commercial_error_code) : "";
    if (code === "rate_limited") return { error: "Esperá un momento antes de enviar otra solicitud." };
    return { error: "No se pudo enviar la solicitud." };
  }

  redirect("/demo/gracias");
}
