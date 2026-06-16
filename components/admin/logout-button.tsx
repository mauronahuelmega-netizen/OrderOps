import { logoutAction } from "@/app/admin/actions";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="admin-secondary-link">
        Cerrar sesión
      </button>
    </form>
  );
}
