import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/context";

export default async function AdminIndexPage() {
  const adminContext = await getAdminContext();

  redirect(adminContext ? "/admin/dashboard" : "/admin/login");
}
