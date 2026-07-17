"use client";

import {
  reorderCustomizationGroupsAction
} from "@/app/admin/(protected)/products/customizations/actions";
import CustomizationGroupCard from "@/components/admin/product-customization/customization-group-card";
import SortableReorderList from "@/components/admin/product-customization/sortable-reorder-list";
import type { AdminCustomizationGroup } from "@/lib/product-customization/shared";
import styles from "./product-customization-admin.module.css";

type Props = {
  groups: AdminCustomizationGroup[];
};

export default function SortableGroupsList({ groups }: Props) {
  return (
    <SortableReorderList
      items={groups}
      successFallbackMessage="Orden de aparición de secciones actualizado."
      getItemAriaLabel={(group) => group.name}
      listClassName={styles.list}
      persist={async (orderedIds) => {
        const formData = new FormData();
        formData.set("orderedIdsJson", JSON.stringify(orderedIds));
        return reorderCustomizationGroupsAction({}, formData);
      }}
      renderItem={(group, chrome) => (
        <div className={styles.sortableCardShell}>
          <div className={styles.sortableToolbar}>
            {chrome.dragHandle}
            {chrome.moveControls}
          </div>
          <CustomizationGroupCard group={group} />
        </div>
      )}
    />
  );
}
