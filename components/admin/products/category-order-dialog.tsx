"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveCategoryDisplayOrderAction } from "@/app/admin/(protected)/categories/actions";
import Button from "@/components/ui/Button";
import {
  CATEGORY_ORDER_GENERIC_ERROR_COPY,
  CATEGORY_ORDER_HELPER_COPY,
  CATEGORY_ORDER_STALE_COPY,
  CATEGORY_ORDER_SUCCESS_COPY,
  categoryIdSetsEqual,
  isCategoryOrderDirty,
  moveCategoryInOrder
} from "@/lib/categories/category-order-draft";
import {
  animateCategoryRowReflow,
  captureCategoryRowTops,
  prefersCategoryOrderReducedMotion
} from "@/lib/categories/category-order-reflow-motion";
import styles from "./category-order-dialog.module.css";

export type CategoryOrderItem = {
  id: string;
  name: string;
};

type CategoryOrderDialogProps = {
  categories: CategoryOrderItem[];
  open: boolean;
  onClose: () => void;
};

/**
 * Order-only Category dialog (FILTER mode removed — owner supersession).
 * Canonical reorder input: Subir / Bajar only. Grip/Pointer drag removed.
 */
export default function CategoryOrderDialog({
  categories,
  open,
  onClose
}: CategoryOrderDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const orderListRef = useRef<HTMLUListElement>(null);
  const moveButtonRefs = useRef<Map<string, { up: HTMLButtonElement | null; down: HTMLButtonElement | null }>>(
    new Map()
  );
  const titleId = useId();

  const [persistedOrder, setPersistedOrder] = useState<string[]>(() =>
    categories.map((category) => category.id)
  );
  const [draftOrder, setDraftOrder] = useState<string[]>(() =>
    categories.map((category) => category.id)
  );
  const [membershipStale, setMembershipStale] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [movedId, setMovedId] = useState<string | null>(null);

  const draftOrderRef = useRef(draftOrder);
  const persistedOrderRef = useRef(persistedOrder);
  const pendingReflowTopsRef = useRef<Map<string, number> | null>(null);
  const pendingFocusRef = useRef<{ id: string; direction: "up" | "down" } | null>(
    null
  );

  draftOrderRef.current = draftOrder;
  persistedOrderRef.current = persistedOrder;

  const dirty = isCategoryOrderDirty(persistedOrder, draftOrder);
  const saveEnabled = dirty && !pending && !membershipStale && draftOrder.length >= 2;

  useEffect(() => {
    const serverIds = categories.map((category) => category.id);
    const dirtyNow = isCategoryOrderDirty(
      persistedOrderRef.current,
      draftOrderRef.current
    );

    if (!open || !dirtyNow) {
      setPersistedOrder(serverIds);
      setDraftOrder(serverIds);
      setMembershipStale(false);
      return;
    }

    if (!categoryIdSetsEqual(serverIds, draftOrderRef.current)) {
      setMembershipStale(true);
      setError(CATEGORY_ORDER_STALE_COPY);
    }
  }, [categories, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open) {
      const ids = categories.map((category) => category.id);
      setPersistedOrder(ids);
      setDraftOrder(ids);
      setMembershipStale(false);
      setError(null);
      setSuccess(null);
      setMovedId(null);
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [categories, open]);

  const discardAndClose = useCallback(() => {
    setDraftOrder(persistedOrderRef.current);
    setMembershipStale(false);
    setError(null);
    setMovedId(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const onCancel = (event: Event) => {
      event.preventDefault();
      discardAndClose();
    };

    const onDialogClose = () => {
      if (open) {
        onClose();
      }
    };

    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onDialogClose);
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onDialogClose);
    };
  }, [discardAndClose, onClose, open]);

  const captureReflowSnapshot = useCallback(() => {
    const list = orderListRef.current;
    if (!list || prefersCategoryOrderReducedMotion()) {
      pendingReflowTopsRef.current = null;
      return;
    }
    pendingReflowTopsRef.current = captureCategoryRowTops(list);
  }, []);

  useLayoutEffect(() => {
    const previousTops = pendingReflowTopsRef.current;
    const list = orderListRef.current;
    if (!previousTops || !list) {
      return;
    }
    pendingReflowTopsRef.current = null;
    animateCategoryRowReflow(list, previousTops);

    const focusTarget = pendingFocusRef.current;
    if (focusTarget) {
      pendingFocusRef.current = null;
      const refs = moveButtonRefs.current.get(focusTarget.id);
      const button = focusTarget.direction === "up" ? refs?.up : refs?.down;
      button?.focus();
    }
  }, [draftOrder]);

  useEffect(() => {
    if (!movedId) {
      return;
    }
    const timer = window.setTimeout(() => {
      setMovedId(null);
    }, 160);
    return () => {
      window.clearTimeout(timer);
    };
  }, [movedId]);

  const handleMove = (
    categoryId: string,
    fromIndex: number,
    toIndex: number,
    direction: "up" | "down"
  ) => {
    if (pending || membershipStale) {
      return;
    }
    captureReflowSnapshot();
    pendingFocusRef.current = { id: categoryId, direction };
    setMovedId(categoryId);
    setDraftOrder((current) => moveCategoryInOrder(current, fromIndex, toIndex));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!saveEnabled) {
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await saveCategoryDisplayOrderAction({
        orderedCategoryIds: draftOrder
      });

      if (result.error) {
        setError(result.error);
        if (result.stale) {
          setMembershipStale(true);
        }
        return;
      }

      setPersistedOrder(draftOrder);
      setMembershipStale(false);
      setSuccess(CATEGORY_ORDER_SUCCESS_COPY);
      router.refresh();
      onClose();
    } catch {
      setError(CATEGORY_ORDER_GENERIC_ERROR_COPY);
    } finally {
      setPending(false);
    }
  };

  const byId = new Map(categories.map((category) => [category.id, category]));
  const orderedCategories = draftOrder
    .map((id) => byId.get(id))
    .filter((category): category is CategoryOrderItem => Boolean(category));

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            Ordenar categorías
          </h2>
          <p className={styles.helper}>{CATEGORY_ORDER_HELPER_COPY}</p>
        </header>

        {success ? (
          <p className={styles.status} role="status" aria-live="polite">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className={styles.alert} role="alert">
            {error}
          </p>
        ) : null}

        <div className={`${styles.body} ${styles.bodyOrder}`}>
          <ul
            ref={orderListRef}
            className={styles.orderList}
            aria-label="Reordenar categorías"
          >
            {orderedCategories.map((category, index) => {
              const isFirst = index === 0;
              const isLast = index === orderedCategories.length - 1;
              const isMoved = movedId === category.id;

              return (
                <li
                  key={category.id}
                  className={`${styles.orderRow} ${isMoved ? styles.orderRowMoved : ""}`}
                  data-category-order-id={category.id}
                >
                  <span className={styles.orderName} title={category.name}>
                    {category.name}
                  </span>

                  <div className={styles.moveControls}>
                    <button
                      ref={(node) => {
                        const current = moveButtonRefs.current.get(category.id) ?? {
                          up: null,
                          down: null
                        };
                        current.up = node;
                        moveButtonRefs.current.set(category.id, current);
                      }}
                      type="button"
                      className={styles.moveButton}
                      aria-label={`Subir ${category.name}`}
                      disabled={pending || membershipStale || isFirst}
                      onClick={() => handleMove(category.id, index, index - 1, "up")}
                    >
                      <ChevronUp
                        className={styles.moveIcon}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      ref={(node) => {
                        const current = moveButtonRefs.current.get(category.id) ?? {
                          up: null,
                          down: null
                        };
                        current.down = node;
                        moveButtonRefs.current.set(category.id, current);
                      }}
                      type="button"
                      className={styles.moveButton}
                      aria-label={`Bajar ${category.name}`}
                      disabled={pending || membershipStale || isLast}
                      onClick={() => handleMove(category.id, index, index + 1, "down")}
                    >
                      <ChevronDown
                        className={styles.moveIcon}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <footer className={styles.footer}>
          <Button
            type="button"
            variant="ghost"
            className={styles.footerGhost}
            onClick={discardAndClose}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            className={styles.footerPrimary}
            data-save-enabled={saveEnabled ? "true" : "false"}
            data-save-pending={pending ? "true" : "false"}
            onClick={() => {
              void handleSave();
            }}
            disabled={!saveEnabled}
          >
            {pending ? "Guardando…" : "Guardar orden"}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
