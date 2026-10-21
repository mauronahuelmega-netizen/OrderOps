import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommissionGroupsView, commissionRecordText, type CommissionGroup } from "@/components/promoter/commission-groups-view";
import { formatArsFromCents } from "@/lib/commercial/money";

const filled = formatArsFromCents(250000);
const emptySlot = formatArsFromCents(0);
const representative: CommissionGroup = {
  business_id: "434b745b-611e-4fa4-8335-67f303abe5af",
  display_name: "Negocio Smoke A",
  max_recurring_slots: 12,
  setup: { amount_cents: 1000000, status: "pending" },
  slots: Array.from({ length: 12 }, (_, index) => {
    const slot = index + 1;
    if (slot === 1) {
      return {
        slot,
        commission: {
          amount_cents: 250000,
          status: "pending",
          created_at: "2026-10-18T15:00:00.000Z",
          available_at: null
        }
      };
    }
    if (slot === 4) return { slot, commission: { amount_cents: 180000, status: "available" } };
    return { slot, commission: null };
  })
};

function markup(ready: boolean, businesses: CommissionGroup[]) {
  return renderToStaticMarkup(createElement(CommissionGroupsView, { ready, businesses, metaClassName: "meta" }));
}

const shown = markup(true, [representative]);
assert.equal(shown.includes("Negocio Smoke A"), true);
assert.equal(shown.includes("Slots del contrato: 12"), true);
assert.equal(shown.includes(commissionRecordText("Slot 1", representative.slots?.[0].commission ?? {})), true);
assert.equal(shown.includes("sin fecha de disponibilidad en esta lectura"), true);
assert.equal(shown.includes("creada "), true);
assert.equal(shown.includes("Slot 4 · available ·"), true);
assert.equal(shown.includes("Slot 2: sin comisión registrada."), true);
assert.equal(shown.includes("Slot 12: sin comisión registrada."), true);
assert.equal((shown.match(/sin comisión registrada/g) ?? []).length, 10);
assert.equal(shown.includes("Activación · pending ·"), true);
assert.equal(emptySlot !== filled, true);
assert.equal(shown.includes(filled), true);

const empty = markup(true, []);
assert.equal(empty.includes("No hay comercios con contrato de comisión en esta lectura."), true);
assert.equal(empty.includes("Negocio Smoke A"), false);
assert.equal(empty.includes("No se pudieron cargar las comisiones."), false);

const failed = markup(false, [representative]);
assert.equal(failed.includes("No se pudieron cargar las comisiones."), true);
assert.equal(failed.includes("Negocio Smoke A"), false);

console.log("commission-groups.verify: ok");
