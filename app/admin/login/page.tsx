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
  missing_credentials: "Ingresá tu email y tu contraseña.",
  invalid_credentials: "No pudimos validar tus credenciales. Revisá email y contraseña."
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
          <h1>Panel de administración</h1>
          <p>Gestioná pedidos y catálogo de tu negocio.</p>
        </div>

        {errorMessage ? <p className="admin-feedback admin-feedback--error">{errorMessage}</p> : null}

        <form action={loginAction} className="admin-login-form">
          <label className="admin-field" htmlFor="email">
            <span>Email</span>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </label>

          <label className="admin-field" htmlFor="password">
            <span>Contraseña</span>
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
            <h2>¿No podés acceder?</h2>
            <p>Contactá soporte para revisar tu acceso al panel.</p>
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
