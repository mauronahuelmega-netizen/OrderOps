export function contactCopyPresentation(confirmed: boolean) {
  if (confirmed) {
    return { label: "Copiado", alert: null, status: "El número quedó en el portapapeles." };
  }
  return {
    label: "Copiar",
    alert: "No pudimos copiar el número. Lo dejamos seleccionado para que lo copies manualmente.",
    status: null
  };
}
