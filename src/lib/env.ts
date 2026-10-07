export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
};

export function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  const list = allowedEmails();
  if (list.length === 0) return true;
  return !!email && list.includes(email.toLowerCase());
}

export const integrations = {
  anthropic: () => !!process.env.ANTHROPIC_API_KEY,
  sumble: () => !!process.env.SUMBLE_API_KEY,
  evaboot: () => !!process.env.EVABOOT_API_KEY,
  mapbox: () => !!process.env.MAPBOX_TOKEN,
};
