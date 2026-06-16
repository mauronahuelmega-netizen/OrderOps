"use client";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  BOARD_OPERATIONAL_SEARCH_ARIA_LABEL,
  BOARD_OPERATIONAL_SEARCH_PLACEHOLDER
} from "@/lib/orders/natural-search";
import { DASHBOARD_EXECUTION_SEARCH_SECTION_ARIA_LABEL } from "@/lib/orders/dashboard-execution-view-model";
import { Search } from "lucide-react";
import styles from "./operational-search.module.css";

type OperationalSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchAriaLabel?: string;
  sectionAriaLabel?: string;
  clearAriaLabel?: string;
};

export default function OperationalSearch({
  value,
  onChange,
  placeholder = BOARD_OPERATIONAL_SEARCH_PLACEHOLDER,
  searchAriaLabel = BOARD_OPERATIONAL_SEARCH_ARIA_LABEL,
  sectionAriaLabel = DASHBOARD_EXECUTION_SEARCH_SECTION_ARIA_LABEL,
  clearAriaLabel = "Limpiar b\u00fasqueda"
}: OperationalSearchProps) {
  const hasValue = value.trim().length > 0;

  return (
    <section className={styles["admin-orders-search"]} aria-label={sectionAriaLabel}>
      <div className={styles["admin-orders-search__field"]}>
        <div className={styles["admin-orders-search__input-shell"]}>
          <Search
            aria-hidden="true"
            className={styles["admin-orders-search__icon"]}
            size={16}
          />
          <Input
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={styles["admin-orders-search__input"]}
            placeholder={placeholder}
            aria-label={searchAriaLabel}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        {hasValue ? (
          <Button
            type="button"
            variant="ghost"
            className={styles["admin-orders-search__clear"]}
            onClick={() => onChange("")}
            aria-label={clearAriaLabel}
          >
            Limpiar
          </Button>
        ) : null}
      </div>
    </section>
  );
}
