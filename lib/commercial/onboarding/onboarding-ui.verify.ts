import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { onboardingStatusLabel } from "@/lib/commercial/onboarding/read-model";

assert.equal(onboardingStatusLabel("pending_client"), "Pendiente");
assert.equal(onboardingStatusLabel("rejected"), "Rechazada");
assert.equal(onboardingStatusLabel("expired"), "Vencida");
assert.equal(onboardingStatusLabel("active"), "Aprobada");

const sql = readFileSync("supabase/migrations/20261011030000_commercial_onboarding_reads.sql", "utf8");
assert.equal(sql.includes("grant execute on function public.promoter_onboarding_products(uuid) to authenticated"), true);
assert.equal(sql.includes("revoke all on function commercial.promoter_onboarding_products(uuid) from public, anon, authenticated, service_role"), true);
assert.equal(/product\.price|stock|sku|price_delta/.test(sql), false);

const editor = readFileSync("app/promoter/(panel)/onboarding/[businessId]/editor-form.tsx", "utf8");
assert.equal(editor.includes('name="price"'), false);
assert.equal(editor.includes('name="description"'), true);
assert.equal(editor.includes("promoter_apply_catalog"), false);

const action = readFileSync("app/promoter/(panel)/onboarding/actions.ts", "utf8");
assert.equal(action.includes("createSupabaseServiceClient"), false);
assert.equal(action.includes('"price"'), false);
assert.equal(action.includes("promoter_apply_catalog"), true);

console.log("onboarding-ui.verify: ok");
