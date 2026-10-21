import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const SIGNED_URL_SECONDS = 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PathResult = { ok?: boolean; bucket?: string; path?: string };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // The SQL check (owner/manager of the document's business) runs before any service-role access.
  const { data, error } = await supabase.rpc("business_fiscal_document_path", { p_document_id: id });
  const result = (data ?? null) as PathResult | null;
  if (error || result?.ok !== true || result.bucket !== "commercial-business-documents" || !result.path) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: signed, error: signError } = await createSupabaseServiceClient()
    .storage.from(result.bucket)
    .createSignedUrl(result.path, SIGNED_URL_SECONDS, { download: true });
  if (signError || !signed?.signedUrl) {
    return new NextResponse("Not found", { status: 404 });
  }
  const response = NextResponse.redirect(signed.signedUrl, 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
