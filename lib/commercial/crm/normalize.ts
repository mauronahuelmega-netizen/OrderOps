const ACCENTS = "ÁÀÂÄÃáàâäãÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÖÕóòôöõÚÙÛÜúùûüÑñ";
const PLAIN = "AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNn";

export function normalizeCommercialName(value: string): string | null {
  const folded = Array.from(value.trim())
    .map((char) => {
      const index = ACCENTS.indexOf(char);
      return index >= 0 ? PLAIN[index] : char;
    })
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return folded.length > 0 ? folded : null;
}

export function normalizeArPhone(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.startsWith("54")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith("9") && digits.length === 11) return `+54${digits}`;
  if (digits.length === 10) return `+549${digits}`;
  return null;
}
