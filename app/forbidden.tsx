import Link from "next/link";
import { universalLogoutAction } from "@/app/login/actions";
import { LOGIN_PATH } from "@/lib/auth/login-path";
import styles from "./forbidden.module.css";

export default function ForbiddenPage() {
  return (
    <main className={styles.page}>
      <h1>Acceso denegado</h1>
      <p>Esta cuenta no puede abrir esta sección.</p>
      <p>
        <Link href={LOGIN_PATH}>Ir al inicio de sesión</Link>
      </p>
      <form action={universalLogoutAction}>
        <button type="submit">Cerrar sesión</button>
      </form>
    </main>
  );
}
