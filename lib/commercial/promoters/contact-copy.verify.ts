import assert from "node:assert/strict";
import { contactCopyPresentation } from "./contact-copy";

const copied = contactCopyPresentation(true);
assert.equal(copied.label, "Copiado");
assert.equal(copied.alert, null);
assert.equal(copied.status?.includes("portapapeles"), true);

const failed = contactCopyPresentation(false);
assert.equal(failed.label, "Copiar");
assert.equal(failed.status, null);
assert.equal(failed.alert?.includes("No pudimos copiar"), true);

console.log("contact-copy.verify: ok");
