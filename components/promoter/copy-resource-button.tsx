"use client";

import { useState } from "react";

async function confirmedClipboardWrite(body: string) {
  if (!navigator.clipboard?.writeText) return false;
  await navigator.clipboard.writeText(body);
  try {
    const permission = await navigator.permissions.query({ name: "clipboard-read" as PermissionName });
    if (permission.state !== "granted" || !navigator.clipboard.readText) return true;
    return (await navigator.clipboard.readText()) === body;
  } catch {
    return true;
  }
}

function selectResourceBody() {
  const node = document.getElementById("promoter-resource-body");
  if (!node) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function CopyResourceButton({ body }: { body: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    setState("idle");
    try {
      if (await confirmedClipboardWrite(body)) {
        setState("copied");
        return;
      }
    } catch {
      // The clipboard API rejects the write or the confirmation read.
    }
    selectResourceBody();
    setState("failed");
  }

  return (
    <div>
      <button type="button" onClick={() => void copy()}>
        {state === "copied" ? "Copiado" : "Copiar"}
      </button>
      {state === "copied" ? <p role="status">El texto quedó en el portapapeles.</p> : null}
      {state === "failed" ? (
        <p role="alert">No pudimos copiar el texto. Lo dejamos seleccionado para que lo copies manualmente.</p>
      ) : null}
    </div>
  );
}
