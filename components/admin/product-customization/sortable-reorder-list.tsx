"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  useTransition,
  type DragEvent,
  type ReactNode
} from "react";
import { useRouter } from "next/navigation";
import { moveItemInOrderedIds } from "@/lib/product-customization/shared";
import styles from "./product-customization-admin.module.css";

type ReorderResult = {
  error?: string;
  success?: boolean;
  message?: string;
};

type SortableReorderListProps<T extends { id: string }> = {
  items: T[];
  persist: (orderedIds: string[]) => Promise<ReorderResult>;
  successFallbackMessage: string;
  renderItem: (item: T, chrome: SortableItemChrome) => ReactNode;
  listClassName?: string;
  getItemAriaLabel: (item: T) => string;
};

export type SortableItemChrome = {
  dragHandle: ReactNode;
  moveControls: ReactNode;
  isDragging: boolean;
  isDropTarget: boolean;
  itemClassName: string;
};

export default function SortableReorderList<T extends { id: string }>({
  items,
  persist,
  successFallbackMessage,
  renderItem,
  listClassName,
  getItemAriaLabel
}: SortableReorderListProps<T>) {
  const router = useRouter();
  const listId = useId();
  const [orderedItems, setOrderedItems] = useState(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  const canReorder = orderedItems.length > 1 && !isPending;

  const persistOrder = useCallback(
    (nextItems: T[], previousItems: T[]) => {
      const orderedIds = nextItems.map((item) => item.id);
      setFeedback(null);

      startTransition(async () => {
        const result = await persist(orderedIds);
        if (result.error) {
          setOrderedItems(previousItems);
          setFeedback({ type: "error", text: result.error });
          return;
        }

        setFeedback({
          type: "success",
          text: result.message ?? successFallbackMessage
        });
        router.refresh();
      });
    },
    [persist, router, successFallbackMessage]
  );

  const applyReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!canReorder || fromIndex === toIndex) {
        return;
      }

      const previous = orderedItems;
      const nextIds = moveItemInOrderedIds(
        previous.map((item) => item.id),
        fromIndex,
        toIndex
      );
      const byId = new Map(previous.map((item) => [item.id, item]));
      const nextItems = nextIds
        .map((id) => byId.get(id))
        .filter((item): item is T => Boolean(item));

      setOrderedItems(nextItems);
      persistOrder(nextItems, previous);
    },
    [canReorder, orderedItems, persistOrder]
  );

  function handleDragStart(itemId: string, event: DragEvent<HTMLButtonElement>) {
    if (!canReorder) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
    setDraggingId(itemId);
    setFeedback(null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, itemId: string) {
    if (!draggingId || draggingId === itemId) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropTargetId !== itemId) {
      setDropTargetId(itemId);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, targetId: string) {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    setDropTargetId(null);

    if (!sourceId || sourceId === targetId) {
      return;
    }

    const fromIndex = orderedItems.findIndex((item) => item.id === sourceId);
    const toIndex = orderedItems.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    applyReorder(fromIndex, toIndex);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDropTargetId(null);
  }

  return (
    <div className={styles.sortableRoot}>
      {isPending ? (
        <p className={styles.sortableStatus} aria-live="polite">
          Guardando orden...
        </p>
      ) : null}
      {feedback ? (
        <p
          className={
            feedback.type === "error"
              ? "admin-feedback admin-feedback--error"
              : "admin-feedback admin-feedback--success"
          }
          aria-live="polite"
          role={feedback.type === "error" ? "alert" : undefined}
        >
          {feedback.text}
        </p>
      ) : null}

      <div className={listClassName ?? styles.list} role="list" aria-labelledby={listId}>
        <span id={listId} className={styles.visuallyHidden}>
          Lista ordenable
        </span>
        {orderedItems.map((item, index) => {
          const isDragging = draggingId === item.id;
          const isDropTarget = dropTargetId === item.id && draggingId !== item.id;
          const itemClassName = [
            styles.sortableItem,
            isDragging ? styles.sortableItemDragging : "",
            isDropTarget ? styles.sortableItemDropTarget : ""
          ]
            .filter(Boolean)
            .join(" ");

          const dragHandle = (
            <button
              type="button"
              className={styles.dragHandle}
              draggable={canReorder}
              disabled={!canReorder}
              aria-label={`Arrastrar para reordenar: ${getItemAriaLabel(item)}`}
              title="Arrastrar para reordenar"
              onDragStart={(event) => handleDragStart(item.id, event)}
              onDragEnd={handleDragEnd}
            >
              <span aria-hidden="true">⋮⋮</span>
            </button>
          );

          const moveControls = (
            <div className={styles.moveControls}>
              <button
                type="button"
                className={styles.moveButton}
                aria-label={`Mover ${getItemAriaLabel(item)} hacia arriba`}
                disabled={!canReorder || index === 0}
                onClick={() => applyReorder(index, index - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.moveButton}
                aria-label={`Mover ${getItemAriaLabel(item)} hacia abajo`}
                disabled={!canReorder || index === orderedItems.length - 1}
                onClick={() => applyReorder(index, index + 1)}
              >
                ↓
              </button>
            </div>
          );

          return (
            <div
              key={item.id}
              role="listitem"
              className={itemClassName}
              onDragOver={(event) => handleDragOver(event, item.id)}
              onDrop={(event) => handleDrop(event, item.id)}
              onDragLeave={() => {
                if (dropTargetId === item.id) {
                  setDropTargetId(null);
                }
              }}
            >
              {renderItem(item, {
                dragHandle,
                moveControls,
                isDragging,
                isDropTarget,
                itemClassName
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
