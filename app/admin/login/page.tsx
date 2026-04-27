import { redirect } from "next/navigation";
import { loginAction } from "@/app/admin/login/actions";
import { getAdminContext } from "@/lib/admin/context";
import { getAdminSupportWhatsappUrl } from "@/lib/admin/support";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  missing_credentials: "Ingresa tu email y tu password.",
  invalid_credentials: "No pudimos validar tus credenciales. Revisa email y password."
};

export default async function AdminLoginPage({
  searchParams
}: AdminLoginPageProps) {
  const [adminContext, params] = await Promise.all([
    getAdminContext(),
    searchParams
  ]);

  if (adminContext) {
    redirect("/admin/dashboard");
  }

  const errorMessage = params.error ? errorMessages[params.error] : null;
  const supportUrl = getAdminSupportWhatsappUrl();

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-copy">
          <p className="catalog-eyebrow">OrderOps</p>
          <h1>Panel de administracion</h1>
          <p>Gestiona pedidos y catalogo de tu negocio.</p>
        </div>

        {errorMessage ? <p className="admin-feedback admin-feedback--error">{errorMessage}</p> : null}

        <form action={loginAction} className="admin-login-form">
          <label className="admin-field" htmlFor="email">
            <span>Email</span>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </label>

          <label className="admin-field" htmlFor="password">
            <span>Password</span>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="admin-primary-button">
            Ingresar
          </button>
        </form>

        <div className="admin-login-support">
          <div className="admin-form-header">
            <h2>¿No podes acceder?</h2>
            <p>Contacta soporte para revisar tu acceso al panel.</p>
          </div>

          <a
            href={supportUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-secondary-link"
          >
            Contactar soporte
          </a>
        </div>
      </section>
    </main>
  );
}
