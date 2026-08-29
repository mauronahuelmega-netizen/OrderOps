import Card from "@/components/ui/Card";
import workspaceStyles from "./order-workspace.module.css";
import detailStyles from "./order-detail-surfaces.module.css";
import notesStyles from "./order-notes-section.module.css";

type OrderNotesSectionProps = {
  notes: string | null;
  variant?: "default" | "workstation";
};

export default function OrderNotesSection({
  notes,
  variant = "default"
}: OrderNotesSectionProps) {
  const trimmedNotes = notes?.trim();

  if (!trimmedNotes) {
    return null;
  }

  if (variant === "workstation") {
    return (
      <div className={notesStyles.callout}>
        <h2 className={notesStyles.label}>Indicaciones</h2>
        <p className={notesStyles.body}>{trimmedNotes}</p>
      </div>
    );
  }

  return (
    <Card
      className={`${workspaceStyles["admin-detail-panel"]} ${workspaceStyles["admin-detail-panel--notes"]}`}
    >
      <div className={workspaceStyles["admin-detail-header"]}>
        <h2>Notas</h2>
      </div>

      <div className={detailStyles.detailStack}>
        <p>{trimmedNotes}</p>
      </div>
    </Card>
  );
}
