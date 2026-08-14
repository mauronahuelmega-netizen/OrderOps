"use client";

import CustomizationOptionRow from "@/components/product-customization/shared/customization-option-row";
import type { PublicCustomizationGroup } from "@/lib/product-customization/public-shared";
import styles from "./customization-shared.module.css";

type Props = {
  group: PublicCustomizationGroup;
  selectedOptionIds: string[];
  issue?: string | null;
  /** Public modal: compact 2-col grid for optional groups. Default list for admin/required. */
  optionLayout?: "list" | "compact-grid";
  /** When false, meta badge is visually hidden (sr-only fallback when applicable). Default true. */
  showGroupMeta?: boolean;
  /** When false, group description is visually hidden (sr-only fallback when applicable). Default true. */
  showGroupDescription?: boolean;
  onSelectOption: (optionId: string) => void;
};

function groupMetaScreenReaderLabel(group: PublicCustomizationGroup): string {
  const parts: string[] = [group.isRequired ? "Obligatorio" : "Opcional"];
  if (group.selectionType === "multiple" && group.minSelections > 0) {
    parts.push(`mínimo ${group.minSelections}`);
  }
  if (group.selectionType === "multiple" && group.maxSelections !== null) {
    parts.push(`máximo ${group.maxSelections}`);
  }
  return parts.join(". ");
}

export default function CustomizationOptionGroup({
  group,
  selectedOptionIds,
  issue = null,
  optionLayout = "list",
  showGroupMeta = true,
  showGroupDescription = true,
  onSelectOption
}: Props) {
  const isCompact = optionLayout === "compact-grid";
  const listClass = [styles.optionList, isCompact ? styles.optionListCompact : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={styles.group} data-option-layout={optionLayout}>
      <div className={styles.groupHeader}>
        <h3>{group.name}</h3>
        {showGroupMeta ? (
          <span className={styles.groupMeta}>
            {group.isRequired ? "Obligatorio" : "Opcional"}
            {group.selectionType === "multiple" && group.minSelections > 0
              ? ` · mín. ${group.minSelections}`
              : null}
            {group.selectionType === "multiple" && group.maxSelections !== null
              ? ` · máx. ${group.maxSelections}`
              : null}
          </span>
        ) : null}
      </div>
      {!showGroupMeta || (!showGroupDescription && group.description) ? (
        <span className="sr-only">
          {!showGroupMeta ? groupMetaScreenReaderLabel(group) : null}
          {!showGroupMeta && !showGroupDescription && group.description ? ". " : null}
          {!showGroupDescription && group.description ? group.description : null}
        </span>
      ) : null}
      {showGroupDescription && group.description ? (
        <p className={styles.groupDescription}>{group.description}</p>
      ) : null}

      {group.isBlocked ? (
        <p className={styles.groupError} role="alert">
          No hay opciones disponibles para este grupo requerido.
        </p>
      ) : (
        <ul className={listClass}>
          {group.options.map((option) => {
            const checked = selectedOptionIds.includes(option.id);
            const atMax =
              group.selectionType === "multiple" &&
              group.maxSelections !== null &&
              selectedOptionIds.length >= group.maxSelections &&
              !checked;

            return (
              <CustomizationOptionRow
                key={option.id}
                groupId={group.id}
                selectionType={group.selectionType}
                option={option}
                checked={checked}
                disabled={atMax}
                compact={isCompact}
                onSelect={onSelectOption}
              />
            );
          })}
        </ul>
      )}

      {group.selectionType === "multiple" &&
      group.maxSelections !== null &&
      selectedOptionIds.length >= group.maxSelections ? (
        <p className={styles.footerNote}>
          Alcanzaste el máximo de {group.maxSelections} opciones en esta sección.
        </p>
      ) : null}

      {issue ? (
        <p className={styles.groupError} role="alert">
          {issue}
        </p>
      ) : null}
    </section>
  );
}
