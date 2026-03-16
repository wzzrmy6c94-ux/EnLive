export function sanitizeText(input: string) {
  return input.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export function sanitizeEmail(input: string) {
  return sanitizeText(input).toLowerCase();
}
