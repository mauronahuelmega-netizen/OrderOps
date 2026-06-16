import AudioUnlockGate from "@/components/admin/notifications/audio-unlock-gate";
import AdminDashboardOrders from "@/components/admin/orders/admin-dashboard-orders";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import { requireAdminContext } from "@/lib/admin/context";
import { getAdminOrders } from "@/lib/orders/admin";
import { getActiveStoreSession, getLastClosedStoreSession } from "@/lib/store-sessions/admin";

export default async function AdminDashboardPage() {
  const adminContext = await requireAdminContext();
  const [orders, activeStoreSession, lastClosedStoreSession] = await Promise.all([
    getAdminOrders(adminContext.businessId),
    getActiveStoreSession(adminContext.businessId),
    getLastClosedStoreSession(adminContext.businessId)
  ]);
  const catalogHref = adminContext.businessSlug
    ? `/b/${adminContext.businessSlug}/catalogo`
    : null;

  return (
    <AdminPageLayout size="operational">
      <AudioUnlockGate
        currentUserRole={adminContext.profile.role}
        soundEnabled={adminContext.profile.newOrderSoundEnabled}
      />

      <AdminDashboardOrders
        orders={orders}
        businessId={adminContext.businessId}
        canUpdateOrders={adminContext.permissions.canUpdateOrders}
        currentUserId={adminContext.user.id}
        currentUserEmail={adminContext.user.email}
        notificationPreferences={adminContext.profile.notificationPreferences}
        currentUserRole={adminContext.profile.role}
        catalogHref={catalogHref}
        canManageProducts={adminContext.permissions.canManageProducts}
        initialActiveStoreSession={activeStoreSession}
        initialLastClosedStoreSession={lastClosedStoreSession}
        canManageStoreSession={adminContext.permissions.canManagePublicSettings}
      />
    </AdminPageLayout>
  );
}
