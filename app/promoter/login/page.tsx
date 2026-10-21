import { redirect } from "next/navigation";
import { promoterLoginAction } from "@/app/promoter/login/actions";
import { PromoterLoginSubmit } from "@/app/promoter/login/submit-button";
import styles from "@/app/promoter/login/promoter-login.module.css";
import { PROMOTER_HOME_PATH, safePromoterNext } from "@/lib/commercial/promoters/promoter-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PromoterLoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

const errorMessages: Record<string, string> = {
  missing_credentials: "Ingresá tu correo y tu contraseña.",
  invalid_credentials: "No pudimos validar el correo o la contraseña.",
  auth_unavailable: "El servicio de acceso no está disponible en este momento. Intentá de nuevo en unos minutos.",
  not_promoter: "Esta cuenta no tiene acceso al portal de promotores.",
  session: "Tu sesión venció. Volvé a ingresar para continuar."
};

export default async function PromoterLoginPage({ searchParams }: PromoterLoginPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let signedInWithoutPromoter = false;
  if (user) {
    const { data } = await supabase.rpc("promoter_session");
    const session = (data ?? null) as { ok?: boolean } | null;
    if (session?.ok === true) redirect(safePromoterNext(params.next) || PROMOTER_HOME_PATH);
    signedInWithoutPromoter = true;
  }

  const errorMessage =
    (params.error ? errorMessages[params.error] : null) ??
    (signedInWithoutPromoter ? errorMessages.not_promoter : null);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.copy}>
          <p className={styles.brand}>ORDEROPS</p>
          <h1>Portal de Promotores</h1>
          <p>Acceso para promotores comerciales habilitados.</p>
        </div>

        {errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}

        <form action={promoterLoginAction} className={styles.form}>
          <label className={styles.field} htmlFor="promoter-email">
            <span>Correo electrónico</span>
            <input id="promoter-email" name="email" type="email" autoComplete="email" required />
          </label>
          <label className={styles.field} htmlFor="promoter-password">
            <span>Contraseña</span>
            <input
              id="promoter-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <input type="hidden" name="next" value={safePromoterNext(params.next)} />
          <PromoterLoginSubmit />
        </form>

        <p className={styles.note}>
          El alta de promotores y la recuperación de contraseña no están disponibles en este portal.
        </p>
      </section>
    </main>
  );
}
