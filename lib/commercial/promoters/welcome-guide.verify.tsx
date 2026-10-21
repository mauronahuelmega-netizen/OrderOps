import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  WelcomeGuideView,
  welcomeGuideButtonLabel,
  welcomeGuideVisible
} from "@/components/promoter/welcome-guide-view";
import { welcomeDismissedAfterWrite } from "@/lib/commercial/promoters/welcome-write";

const steps = [{ label: "Hay una tarea abierta", done: true }];

function markup(state: {
  readOk: boolean;
  dismissed: boolean;
  writeError: boolean;
}) {
  return renderToStaticMarkup(
    createElement(WelcomeGuideView, {
      readOk: state.readOk,
      visible: welcomeGuideVisible(state.readOk, state.dismissed),
      writeError: state.writeError,
      pending: false,
      buttonLabel: welcomeGuideButtonLabel(state.dismissed),
      steps,
      onPress: () => undefined
    })
  );
}

const readFailed = markup({ readOk: false, dismissed: true, writeError: false });
assert.equal(readFailed.includes("No se pudo confirmar el cierre de esta guía."), true);
assert.equal(readFailed.includes("Hay una tarea abierta"), true);
assert.equal(readFailed.includes("Mostrar la guía"), false);
assert.equal(readFailed.includes("Cerrar la guía"), false);

const closeFailedWrite = welcomeDismissedAfterWrite(false, true);
assert.equal(closeFailedWrite.dismissed, null);
const closeFailed = markup({ readOk: true, dismissed: false, writeError: closeFailedWrite.writeError });
assert.equal(closeFailed.includes("No se pudo guardar el cierre de esta guía."), true);
assert.equal(closeFailed.includes("Cerrar la guía"), true);
assert.equal(closeFailed.includes("Hay una tarea abierta"), true);
assert.equal(closeFailed.includes("Mostrar la guía"), false);

const reopenFailedWrite = welcomeDismissedAfterWrite(false, false);
assert.equal(reopenFailedWrite.dismissed, null);
const reopenFailed = markup({ readOk: true, dismissed: true, writeError: reopenFailedWrite.writeError });
assert.equal(reopenFailed.includes("No se pudo guardar el cierre de esta guía."), true);
assert.equal(reopenFailed.includes("Mostrar la guía"), true);
assert.equal(reopenFailed.includes("Hay una tarea abierta"), false);

const closeOk = welcomeDismissedAfterWrite(true, true);
assert.equal(closeOk.dismissed, true);
assert.equal(closeOk.writeError, false);
const closed = markup({ readOk: true, dismissed: true, writeError: false });
assert.equal(closed.includes("No se pudo guardar el cierre de esta guía."), false);
assert.equal(closed.includes("Mostrar la guía"), true);
assert.equal(closed.includes('data-guide-completed="true"'), true);
assert.equal(closed.includes("Incorporación completada"), true);

const incomplete = renderToStaticMarkup(
  createElement(WelcomeGuideView, {
    readOk: true,
    visible: true,
    writeError: false,
    pending: false,
    buttonLabel: welcomeGuideButtonLabel(false),
    steps: [
      { label: "Hay una tarea abierta", done: true },
      { label: "Hay al menos un comercio en la cartera", done: false }
    ],
    onPress: () => undefined
  })
);
assert.equal(incomplete.includes('data-guide-completed="false"'), true);
assert.equal(incomplete.includes("Incorporación completada"), false);
assert.equal(incomplete.includes("Revisá lo que ya tenés listo para empezar a trabajar."), true);
assert.equal(incomplete.includes("1 de 2 pasos listos."), true);

console.log("welcome-guide.verify: ok");
