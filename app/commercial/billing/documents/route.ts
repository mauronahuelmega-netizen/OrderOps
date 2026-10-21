import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { parseFiscalUpload } from "@/lib/commercial/billing/fiscal-upload";
import { arsInputToCents } from "@/lib/commercial/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const BUCKET = "commercial-business-documents";

type RpcResult = { ok?: boolean; commercial_error_code?: string; roles?: string[]; kind?: string };

// Relative Location: request.url may carry an internal host that differs from the browser origin.
function seeOther(location: string) {
  return new NextResponse(null, { status: 303, headers: { Location: location } });
}

function back(notice: string) {
  return seeOther(`/commercial/billing?notice=${encodeURIComponent(notice)}`);
}

// Route handler instead of a server action: fiscal PDFs exceed the 1 MB server action body limit.
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return seeOther("/admin/login");
  }
  const { data: sessionData } = await supabase.rpc("commercial_session");
  const session = (sessionData ?? null) as RpcResult | null;
  if (session?.ok !== true || session.kind !== "internal" || !(session.roles ?? []).includes("finance")) {
    return back("forbidden");
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const bytes = file instanceof File ? new Uint8Array(await file.arrayBuffer()) : null;
  const parsed = parseFiscalUpload(
    {
      businessId: String(formData.get("businessId") ?? ""),
      kind: String(formData.get("kind") ?? ""),
      documentNumber: String(formData.get("documentNumber") ?? ""),
      issuedOn: String(formData.get("issuedOn") ?? ""),
      amountCents: arsInputToCents(String(formData.get("amount") ?? "")),
      collectionId: String(formData.get("collectionId") ?? "")
    },
    file instanceof File && bytes ? { size: file.size, bytes } : null,
    randomBytes(6).toString("hex")
  );
  if (!parsed.ok) {
    return back(parsed.code);
  }
  const { input } = parsed;

  const storage = createSupabaseServiceClient().storage.from(BUCKET);
  const { error: uploadError } = await storage.upload(input.storagePath, bytes as Uint8Array, {
    contentType: "application/pdf",
    upsert: false
  });
  if (uploadError) {
    return back("upload_failed");
  }

  const { data, error } = await supabase.rpc("finance_register_fiscal_document", {
    p_business_id: input.businessId,
    p_kind: input.kind,
    p_document_number: input.documentNumber,
    p_issued_on: input.issuedOn,
    p_amount_cents: input.amountCents,
    p_collection_id: input.collectionId,
    p_storage_path: input.storagePath
  });
  const result = (data ?? null) as RpcResult | null;
  if (error || result?.ok !== true) {
    await storage.remove([input.storagePath]);
    return back(result?.commercial_error_code ?? "error");
  }
  return back("ok");
}
