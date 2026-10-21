"use client";

import { useState } from "react";
import { contactCopyPresentation } from "@/lib/commercial/promoters/contact-copy";
import styles from "./business-contact-actions.module.css";

const USABLE_PHONE = /^\+549\d{10}$/;

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

export function BusinessContactActions({
  phone,
  businessId
}: {
  phone: string | null | undefined;
  businessId: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  if (!phone || !USABLE_PHONE.test(phone)) return null;
  const digits = phone.slice(1);
  const phoneId = `promoter-contact-phone-${businessId}`;
  const presentation = state === "idle" ? null : contactCopyPresentation(state === "copied");

  async function copy() {
    setState("idle");
    try {
      if (await confirmedClipboardWrite(phone as string)) {
        setState("copied");
        return;
      }
    } catch {
      // The clipboard API rejects the write or the confirmation read.
    }
    const node = document.getElementById(phoneId);
    if (node) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    setState("failed");
  }

  return (
    <div className={styles.actions}>
      <span id={phoneId}>{phone}</span>
      <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer">WhatsApp</a>
      <a href={`tel:${phone}`}>Llamar</a>
      <button type="button" onClick={() => void copy()}>
        {presentation?.label ?? "Copiar"}
      </button>
      {presentation?.status ? <p role="status">{presentation.status}</p> : null}
      {presentation?.alert ? <p role="alert">{presentation.alert}</p> : null}
    </div>
  );
}
