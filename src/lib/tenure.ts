/** Dates are handled as YYYY-MM-DD strings in UTC to avoid timezone drift. */

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

/** Converts "N years, M months in role as of the export date" into a start date. */
export function deriveStartDate(
  exportDate: string,
  years: number | null | undefined,
  months: number | null | undefined,
): string | null {
  if (years == null && months == null) return null;
  const total = (years ?? 0) * 12 + (months ?? 0);
  const d = parseIso(exportDate);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - total);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return toIsoDate(d);
}

export function monthsBetween(startIso: string, endIso: string): number {
  const s = parseIso(startIso);
  const e = parseIso(endIso);
  let months = (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + (e.getUTCMonth() - s.getUTCMonth());
  if (e.getUTCDate() < s.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

export function formatDuration(totalMonths: number): string {
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  const ys = `${y} ${y === 1 ? "Year" : "Years"}`;
  const ms = `${m} ${m === 1 ? "Month" : "Months"}`;
  if (y === 0 && m === 0) return "< 1 Month";
  if (y === 0) return ms;
  if (m === 0) return ys;
  return `${ys} & ${ms}`;
}

export type Tenure = {
  roleMonths: number | null;
  companyMonths: number | null;
  label: string;
  short: string;
  isChangeAgent: boolean;
};

/** A recent role change after a long stint at the company often signals a change agent. */
export const CHANGE_AGENT_ROLE_MONTHS = 12;
export const CHANGE_AGENT_COMPANY_MONTHS = 36;

export function tenure(
  roleStart: string | null | undefined,
  companyStart: string | null | undefined,
  today: string = toIsoDate(new Date()),
): Tenure {
  const roleMonths = roleStart ? monthsBetween(roleStart, today) : null;
  const companyMonths = companyStart ? monthsBetween(companyStart, today) : null;
  const parts: string[] = [];
  if (roleMonths != null) parts.push(`Current: ${formatDuration(roleMonths)}`);
  if (companyMonths != null) parts.push(`Overall: ${formatDuration(companyMonths)}`);
  const shortParts: string[] = [];
  if (roleMonths != null) shortParts.push(shortDuration(roleMonths));
  if (companyMonths != null) shortParts.push(shortDuration(companyMonths));
  return {
    roleMonths,
    companyMonths,
    label: parts.join(" / "),
    short: shortParts.join(" / "),
    isChangeAgent:
      roleMonths != null &&
      companyMonths != null &&
      roleMonths <= CHANGE_AGENT_ROLE_MONTHS &&
      companyMonths >= CHANGE_AGENT_COMPANY_MONTHS,
  };
}

function shortDuration(totalMonths: number): string {
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0) return `${m}mo`;
  if (m === 0) return `${y}y`;
  return `${y}y ${m}mo`;
}

/** Pulls a date like 8_24_2026 or 2026-08-24 out of an export file name. */
export function dateFromFileName(name: string): string | null {
  const us = name.match(/(\d{1,2})[_\-.](\d{1,2})[_\-.](\d{4})/);
  if (us) {
    const [, m, d, y] = us;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    return isValidIso(iso) ? iso : null;
  }
  const isoMatch = name.match(/(\d{4})[_\-.](\d{1,2})[_\-.](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    return isValidIso(iso) ? iso : null;
  }
  return null;
}

function isValidIso(iso: string): boolean {
  const d = parseIso(iso);
  return !Number.isNaN(d.getTime()) && toIsoDate(d) === iso;
}
