/**
 * Pure map logic: how filtered contacts become one pin per city, and cohort
 * helpers. Framework-free so the grouping is unit-testable; the Leaflet wiring
 * lives in the map view.
 */
export type MapPerson = {
  id: string;
  full_name: string;
  title: string | null;
  avatar_path: string | null;
  email: string | null;
  location: string | null;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
  location_lat: number | null;
  location_lng: number | null;
  account_id: string | null;
  org_id: string | null;
  influence_score: number | null;
  is_key: boolean;
  statuses: string[];
  personas: string[];
  seniority_level: string | null;
};

export type CityPin = {
  /** Grouping key: lowercased city label. */
  key: string;
  city: string;
  lat: number;
  lng: number;
  count: number;
};

/** The city a person pins to; free-text locations fall back to the raw string. */
export function cityKeyOf(p: Pick<MapPerson, "location" | "location_city">): string {
  return (p.location_city?.trim() || p.location?.trim() || "Unknown").toLowerCase();
}

/**
 * One pin per city — same-city contacts share a dot with a headcount, which is
 * the "who's in Phoenix for the regional dinner" view. Contacts without
 * coordinates still join their city's pin when a neighbor there is geocoded;
 * only cities nobody can place (and people with no location text at all) are
 * counted off the map.
 */
export function cityPins(people: MapPerson[]): { pins: CityPin[]; unmapped: number } {
  const groups = new Map<string, { label: string; lats: number[]; lngs: number[]; total: number }>();
  let unmapped = 0;
  for (const p of people) {
    const label = p.location_city?.trim() || p.location?.trim();
    if (!label) {
      unmapped++;
      continue;
    }
    const key = label.toLowerCase();
    const g = groups.get(key) ?? { label, lats: [], lngs: [], total: 0 };
    g.total++;
    if (p.location_lat != null && p.location_lng != null) {
      g.lats.push(p.location_lat);
      g.lngs.push(p.location_lng);
    }
    groups.set(key, g);
  }
  const pins: CityPin[] = [];
  for (const [key, g] of groups) {
    if (g.lats.length === 0) {
      unmapped += g.total;
      continue;
    }
    pins.push({
      key,
      city: g.label,
      lat: g.lats.reduce((a, b) => a + b, 0) / g.lats.length,
      lng: g.lngs.reduce((a, b) => a + b, 0) / g.lngs.length,
      count: g.total,
    });
  }
  pins.sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
  return { pins, unmapped };
}

/** Unique, non-empty emails for the cohort — backs the copy-to-clipboard action. */
export function emailsOf(people: Pick<MapPerson, "email">[]): string[] {
  const seen = new Set<string>();
  for (const p of people) {
    const e = p.email?.trim().toLowerCase();
    if (e) seen.add(e);
  }
  return [...seen];
}
