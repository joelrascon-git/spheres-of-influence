/**
 * Pure signal helpers: the status ladder every surface shares, URL identity
 * for dedupe, the scan's zod contract, and the citation check that drops any
 * signal whose source was not actually fetched by the web-search tool.
 */
import { z } from "zod";

export const SIGNAL_STATUSES = ["new", "linked", "dismissed"] as const;
export type SignalStatus = (typeof SIGNAL_STATUSES)[number];

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional();

/** One signal as the scan model returns it. */
export const scanSignal = z.object({
  title: z.string().min(1).max(300),
  summary: z.string().min(1).max(2000),
  so_what: z.string().min(1).max(1000),
  source_name: z.string().min(1).max(200),
  source_url: z.string().url(),
  source_date: isoDate,
  relevance: z.number().int().min(1).max(5),
});

export const scanResult = z.array(scanSignal);
export type ScanSignal = z.infer<typeof scanSignal>;

/** Lowercases the host and drops query strings, fragments and trailing slashes, so the same page is one identity (utm noise collapses). */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.protocol}//${u.host.toLowerCase()}${path}`;
  } catch {
    return url.trim();
  }
}

/** A stable identity for a URL: djb2 hex. Enough to dedupe scans cheaply. */
export function hashUrl(url: string): string {
  const s = normalizeUrl(url);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0") + "-" + s.length.toString(16);
}

/**
 * The citation hard check, in code: a signal survives only when its source URL
 * (normalized) is among the URLs the web-search tool actually fetched, and is
 * not already stored (or repeated in this batch).
 */
export function keepCitedSignals(
  candidates: ScanSignal[],
  fetchedUrls: Set<string>,
  existingUrls: Set<string>,
): { kept: ScanSignal[]; dropped: number } {
  const seen = new Set(existingUrls);
  const kept: ScanSignal[] = [];
  let dropped = 0;
  for (const c of candidates) {
    const key = normalizeUrl(c.source_url);
    if (!fetchedUrls.has(key) || seen.has(key)) {
      dropped++;
      continue;
    }
    seen.add(key);
    kept.push(c);
  }
  return { kept, dropped };
}
