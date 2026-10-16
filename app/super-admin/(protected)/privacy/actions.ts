"use server";

import { redirect } from "next/navigation";

import { requireSuperAdmin } from "@/lib/super-admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RpcResult = { ok?: boolean; commercial_error_code?: string };

function noticeFrom(result: RpcResult | null): string {
  if (result?.ok === true) return "ok";
  return result?.commercial_error_code ?? "error";
}

async function finish(result: RpcResult | null) {
  redirect(`/super-admin/privacy?notice=${encodeURIComponent(noticeFrom(result))}`);
}

export async function archiveOpportunity(formData: FormData) {
  await requireSuperAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("archive_opportunity", {
    p_opportunity_id: String(formData.get("opportunityId") ?? ""),
    p_reason: String(formData.get("reason") ?? "")
  });
  if (error) await finish(null);
  await finish(data as RpcResult | null);
}

export async function openPrivacyRequest(formData: FormData) {
  await requireSuperAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("open_privacy_request", {
    p_subject_kind: "contact",
    p_subject_ref: String(formData.get("contactId") ?? ""),
    p_request_kind: "deletion"
  });
  if (error) await finish(null);
  await finish(data as RpcResult | null);
}

export async function resolvePrivacyRequest(formData: FormData) {
  await requireSuperAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("resolve_privacy_request", {
    p_request_id: String(formData.get("requestId") ?? ""),
    p_status: "fulfilled",
    p_notes: String(formData.get("notes") ?? "")
  });
  if (error) await finish(null);
  await finish(data as RpcResult | null);
}
