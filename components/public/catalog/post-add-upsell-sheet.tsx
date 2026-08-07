"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  attachUpsellChildToParent,
  type LocalCartItem
} from "@/lib/cart/local";
import {
  formatPublicCatalogCurrency,
  type PublicUpsellSuggestedProduct
} from "@/lib/product-customization/public-shared";
import PublicStorageImage from "@/components/public/catalog/public-storage-image";
import styles from "./post-add-upsell-sheet.module.css";
import { usePublicOverlayScrollLock } from "./public-overlay-scroll-lock";

export type PostAddUpsellOpportunity = {
  parentCartLineId: string;
  candidates: PublicUpsellSuggestedProduct[];
};

type CandidateUiState = {
  attached: boolean;
  pending: boolean;
  blocked: boolean;
  error: string | null;
};

type PostAddUpsellSheetProps = {
  opportunity: PostAddUpsellOpportunity;
  items: LocalCartItem[];
  onItemsChange: (items: LocalCartItem[]) => void;
  onFinish: () => void;
  onParentMissing: (message: string) => void;
};

const PARENT_MISSING_MESSAGE =
  "No pudimos agregar este adicional. Revisá tu pedido.";

function emptyCandidateState(): CandidateUiState {
  return {
    attached: false,
    pending: false,
    blocked: false,
    error: null
  };
}

export default function PostAddUpsellSheet({
  opportunity,
  items,
  onItemsChange,
  onFinish,
  onParentMissing
}: PostAddUpsellSheetProps) {
  usePublicOverlayScrollLock();
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const finishingRef = useRef(false);
  const mutationLockRef = useRef(false);
  const itemsRef = useRef(items);
  const onFinishRef = useRef(onFinish);
  const onParentMissingRef = useRef(onParentMissing);
  const onItemsChangeRef = useRef(onItemsChange);

  itemsRef.current = items;
  onFinishRef.current = onFinish;
  onParentMissingRef.current = onParentMissing;
  onItemsChangeRef.current = onItemsChange;

  const [candidateState, setCandidateState] = useState<
    Record<string, CandidateUiState>
  >(() => {
    const initial: Record<string, CandidateUiState> = {};
    for (const candidate of opportunity.candidates) {
      initial[candidate.id] = emptyCandidateState();
    }
    return initial;
  });

  const attachedCount = Object.values(candidateState).filter(
    (state) => state.attached
  ).length;
  const footerLabel = attachedCount > 0 ? "Listo" : "Ahora no";

  useEffect(() => {
    closeRef.current?.focus();

    return () => {
    };
  }, []);

  useEffect(() => {
    function finishOnce() {
      if (finishingRef.current) {
        return;
      }
      finishingRef.current = true;
      onFinishRef.current();
    }

    function focusableElements() {
      const root = sheetRef.current;
      if (!root) {
        return [] as HTMLElement[];
      }
      return [
        ...root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ].filter(
        (el) =>
          !el.hasAttribute("disabled") &&
          el.tabIndex !== -1 &&
          el.getClientRects().length > 0
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        finishOnce();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = focusableElements();
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !sheetRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!active || active === last || !sheetRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, []);

  function finishOnce() {
    if (finishingRef.current) {
      return;
    }
    finishingRef.current = true;
    onFinishRef.current();
  }

  function updateCandidate(
    productId: string,
    patch: Partial<CandidateUiState>
  ) {
    setCandidateState((current) => {
      const previous = current[productId] ?? emptyCandidateState();
      return {
        ...current,
        [productId]: { ...previous, ...patch }
      };
    });
  }

  function handleAttach(candidate: PublicUpsellSuggestedProduct) {
    const state = candidateState[candidate.id];
    if (
      mutationLockRef.current ||
      state?.pending ||
      state?.attached ||
      state?.blocked
    ) {
      return;
    }

    mutationLockRef.current = true;
    updateCandidate(candidate.id, { pending: true, error: null });

    const result = attachUpsellChildToParent({
      items: itemsRef.current,
      parentCartLineId: opportunity.parentCartLineId,
      suggestedProduct: candidate
    });

    if (result.outcome === "attached") {
      itemsRef.current = result.items;
      onItemsChangeRef.current(result.items);
      updateCandidate(candidate.id, {
        attached: true,
        pending: false,
        blocked: false,
        error: null
      });
      mutationLockRef.current = false;
      return;
    }

    if (result.outcome === "already_attached") {
      updateCandidate(candidate.id, {
        attached: true,
        pending: false,
        blocked: false,
        error: null
      });
      mutationLockRef.current = false;
      return;
    }

    if (result.outcome === "signature_conflict") {
      updateCandidate(candidate.id, {
        pending: false,
        blocked: true,
        attached: false,
        error: "Ya tenés esta combinación en tu pedido."
      });
      mutationLockRef.current = false;
      return;
    }

    updateCandidate(candidate.id, { pending: false });
    mutationLockRef.current = false;
    onParentMissingRef.current(PARENT_MISSING_MESSAGE);
  }

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      data-preview-pan-ignore
      onClick={finishOnce}
    >
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <h2 id={titleId}>¿Sumás algo más?</h2>
            <p id={descriptionId} className={styles.headerMeta}>
              Completá tu pedido con alguno de estos adicionales.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.iconButton}
            onClick={finishOnce}
            aria-label="Cerrar sugerencias"
          >
            <X aria-hidden="true" focusable="false" size={20} strokeWidth={2} />
          </button>
        </header>

        <div className={styles.body}>
          <ul className={styles.list}>
            {opportunity.candidates.map((candidate) => {
              const state = candidateState[candidate.id] ?? emptyCandidateState();
              const errorId = `post-add-error-${candidate.id}`;
              const formattedPrice = formatPublicCatalogCurrency(candidate.price);
              const ctaDisabled =
                state.pending || state.attached || state.blocked;
              const ctaLabel = state.attached
                ? "Agregado"
                : "Agregar";
              const ctaAriaLabel = state.attached
                ? `${candidate.name} agregado`
                : `Agregar ${candidate.name} por ${formattedPrice}`;

              return (
                <li key={candidate.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    {candidate.imageUrl ? (
                      <div className={styles.thumb}>
                        <PublicStorageImage
                          src={candidate.imageUrl}
                          alt=""
                          width={56}
                          height={56}
                          className={styles.thumbImage}
                        />
                      </div>
                    ) : (
                      <div className={styles.thumbPlaceholder} aria-hidden="true" />
                    )}
                    <div className={styles.rowContent}>
                      <div className={styles.rowCopy}>
                        <strong className={styles.productName}>{candidate.name}</strong>
                        <span className={styles.unitPrice}>{formattedPrice}</span>
                        {state.error ? (
                          <p
                            id={errorId}
                            className={styles.candidateError}
                            role="alert"
                          >
                            {state.error}
                          </p>
                        ) : null}
                      </div>
                      <div className={styles.rowAction}>
                        <button
                          type="button"
                          className={
                            state.attached ? styles.attachedButton : styles.addButton
                          }
                          disabled={ctaDisabled}
                          aria-busy={state.pending || undefined}
                          aria-describedby={state.error ? errorId : undefined}
                          aria-label={ctaAriaLabel}
                          onClick={() => handleAttach(candidate)}
                        >
                          {ctaLabel}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={finishOnce}
          >
            {footerLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
