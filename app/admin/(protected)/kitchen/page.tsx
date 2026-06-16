"use client";

import { notFound } from "next/navigation";
import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import { useAdminBusinessSettings } from "@/components/admin/admin-shell";

export default function AdminKitchenPage() {
  const { settings } = useAdminBusinessSettings();

  if (!settings?.kitchen_mode_active) {
    notFound();
  }

  return (
    <AdminPageLayout size="wide">
      <AdminPageHeader
        eyebrow="Operaciones"
        title="Cocina"
        description="Vista operativa de preparación. Disponible cuando Kitchen Mode está activo para tu negocio."
      />
    </AdminPageLayout>
  );
}
