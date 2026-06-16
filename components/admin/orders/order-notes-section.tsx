import Card from "@/components/ui/Card";
import workspaceStyles from "./order-workspace.module.css";
import detailStyles from "./order-detail-surfaces.module.css";

type OrderNotesSectionProps = {
  notes: string | null;
};

export default function OrderNotesSection({ notes }: OrderNotesSectionProps) {
  if (!notes?.trim()) {
    return null;
  }

  return (
    <Card
      className={`${workspaceStyles["admin-detail-panel"]} ${workspaceStyles["admin-detail-panel--notes"]}`}
    >
      <div className={workspaceStyles["admin-detail-header"]}>
        <h2>Notas</h2>
      </div>

      <div className={detailStyles.detailStack}>
        <p>{notes.trim()}</p>
      </div>
    </Card>
  );
}
