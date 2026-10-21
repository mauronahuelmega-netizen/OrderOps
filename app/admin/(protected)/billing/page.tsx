import BillingView from "@/components/admin/billing/billing-view";
import { requireAdminContext } from "@/lib/admin/context";
import { billingEnvironment, parseBillingSummary } from "@/lib/commercial/billing/billing-summary";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  await requireAdminContext();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("business_billing_summary", {
    p_environment: billingEnvironment(process.env)
  });
  const summary = error ? parseBillingSummary(null) : parseBillingSummary(data);
  return <BillingView summary={summary} now={new Date()} />;
}
