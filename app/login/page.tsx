import { redirect } from "next/navigation";
import {
  chooseAreaAction,
  universalLoginAction,
  universalLogoutAction
} from "@/app/login/actions";
import { LoginSubmitButton } from "@/app/login/submit-button";
import styles from "@/app/login/login.module.css";
import { listAuthorizedAreas } from "@/lib/auth/list-authorized-areas";
import { isLoginErrorCode, LOGIN_ERROR_MESSAGES } from "@/lib/auth/login-path";
import { resolveLoginDestination } from "@/lib/auth/resolve-login-destination";
import { sanitizeInternalNext } from "@/lib/auth/safe-next";
import { getAdminSupportWhatsappUrl } from "@/lib/admin/support";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthorizedArea } from "@/lib/auth/authorized-areas";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
    choose?: string;
  }>;
};

export default async function UniversalLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = sanitizeInternalNext(params.next);
  const forceChoose = params.choose === "1";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let chooseAreas: AuthorizedArea[] | null = null;
  let showNoAccess = false;

  if (user) {
    const areas = await listAuthorizedAreas(supabase, user.id);
    const destination = resolveLoginDestination({ areas, next });

    if (destination.kind === "none") {
      showNoAccess = true;
    } else if (destination.kind === "redirect" && !forceChoose) {
      redirect(destination.href);
    } else {
      chooseAreas = areas;
      if (chooseAreas.length === 0) {
        showNoAccess = true;
        chooseAreas = null;
      }
    }
  }

  const errorCode = isLoginErrorCode(params.error) ? params.error : null;
  const errorMessage =
    (errorCode ? LOGIN_ERROR_MESSAGES[errorCode] : null) ??
    (showNoAccess ? LOGIN_ERROR_MESSAGES.no_access : null);
  const supportUrl = getAdminSupportWhatsappUrl();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.copy}>
          <p className={styles.brand}>ORDEROPS</p>
          <h1>{chooseAreas ? "Elegí un área" : "Iniciar sesión"}</h1>
          <p>
            {chooseAreas
              ? "Tu cuenta tiene acceso a más de un espacio. Seleccioná adónde querés ingresar."
              : "Accedé al espacio que tengas autorizado con tu email y contraseña."}
          </p>
        </div>

        {errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}

        {chooseAreas ? (
          <>
            <div className={styles.areas}>
              {chooseAreas.map((area) => (
                <form key={area.id} action={chooseAreaAction}>
                  <input type="hidden" name="href" value={area.href} />
                  <button type="submit" className={styles.areaButton}>
                    {area.label}
                  </button>
                </form>
              ))}
            </div>
            <form action={universalLogoutAction}>
              <button type="submit" className={styles.secondaryButton}>
                Usar otra cuenta
              </button>
            </form>
          </>
        ) : showNoAccess && user ? (
          <form action={universalLogoutAction}>
            <button type="submit" className={styles.submit}>
              Volver a iniciar sesión
            </button>
          </form>
        ) : (
          <form action={universalLoginAction} className={styles.form}>
            <label className={styles.field} htmlFor="login-email">
              <span>Email</span>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className={styles.field} htmlFor="login-password">
              <span>Contraseña</span>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <LoginSubmitButton />
          </form>
        )}

        <div className={styles.support}>
          <p className={styles.note}>¿No podés acceder? Contactá soporte para revisar tu cuenta.</p>
          <a href={supportUrl} target="_blank" rel="noreferrer" className={styles.supportLink}>
            Contactar soporte
          </a>
        </div>
      </section>
    </main>
  );
}
