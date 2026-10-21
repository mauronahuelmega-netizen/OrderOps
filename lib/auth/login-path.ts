export const LOGIN_PATH = "/login";

export type LoginErrorCode =
  | "missing_credentials"
  | "invalid_credentials"
  | "auth_unavailable"
  | "no_access"
  | "session";

export const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
  missing_credentials: "Ingresá tu email y tu contraseña.",
  invalid_credentials: "No pudimos validar tus credenciales. Revisá email y contraseña.",
  auth_unavailable:
    "El servicio de acceso no está disponible en este momento. Intentá de nuevo en unos minutos.",
  no_access: "Tu cuenta está autenticada, pero no tiene un área autorizada en OrderOps.",
  session: "Tu sesión venció. Volvé a ingresar para continuar."
};

export function isLoginErrorCode(value: string | undefined): value is LoginErrorCode {
  return Boolean(value && value in LOGIN_ERROR_MESSAGES);
}

export function loginPathWith(params: {
  error?: LoginErrorCode;
  next?: string | null;
  choose?: boolean;
}): string {
  const search = new URLSearchParams();
  if (params.error) search.set("error", params.error);
  if (params.next) search.set("next", params.next);
  if (params.choose) search.set("choose", "1");
  const query = search.toString();
  return query ? `${LOGIN_PATH}?${query}` : LOGIN_PATH;
}
