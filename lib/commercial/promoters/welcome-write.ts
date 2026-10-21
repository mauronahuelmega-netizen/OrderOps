export function welcomeDismissedAfterWrite(ok: boolean, next: boolean) {
  if (ok) return { dismissed: next, writeError: false };
  return { dismissed: null, writeError: true };
}
