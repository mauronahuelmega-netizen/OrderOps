export type ArgentinePhoneResult =
  | { ok: true; e164: string; nationalNumber: string }
  | {
      ok: false;
      reason: "empty" | "invalid_characters" | "invalid_country" | "invalid_length" | "invalid_format";
    };

const ALLOWED_PHONE_CHARACTERS = /^[\d\s+().-]+$/;

export function parseArgentineMobilePhone(value: string): ArgentinePhoneResult {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  if (!ALLOWED_PHONE_CHARACTERS.test(trimmed)) return { ok: false, reason: "invalid_characters" };

  const plusIndex = trimmed.indexOf("+");
  if (plusIndex > 0 || (plusIndex === 0 && trimmed.indexOf("+", 1) !== -1)) {
    return { ok: false, reason: "invalid_format" };
  }

  const hadInternationalPrefix = plusIndex === 0;
  let digits = trimmed.replace(/\D/g, "");
  if (hadInternationalPrefix && !digits.startsWith("54")) return { ok: false, reason: "invalid_country" };

  if (digits.startsWith("549")) digits = digits.slice(3);
  else if (digits.startsWith("54")) digits = digits.slice(2);
  if (digits.startsWith("9")) digits = digits.slice(1);
  if (digits.startsWith("0")) digits = digits.slice(1);

  if (digits.length === 12) {
    const markerIndex = [2, 3, 4].find((index) => digits.slice(index, index + 2) === "15");
    if (markerIndex !== undefined) digits = `${digits.slice(0, markerIndex)}${digits.slice(markerIndex + 2)}`;
  }

  if (digits.length !== 10) return { ok: false, reason: "invalid_length" };
  if (digits.startsWith("0") || /^0+$/.test(digits)) return { ok: false, reason: "invalid_format" };
  return { ok: true, nationalNumber: digits, e164: `+549${digits}` };
}
