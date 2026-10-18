"use client";

import { useState } from "react";

export function CopyResourceButton({ body }: { body: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void copy()}>
        {state === "copied" ? "Copiado" : "Copiar"}
      </button>
      {state === "copied" ? <p role="status">El texto quedó en el portapapeles.</p> : null}
      {state === "failed" ? <p role="alert">No pudimos copiar el texto. Seleccionalo manualmente.</p> : null}
    </div>
  );
}
