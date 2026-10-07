export type Place = {
  label: string;
  lat: number;
  lng: number;
  city: string | null;
  region: string | null;
  country: string | null;
};

/** LinkedIn metro names ("Greater Phoenix Area") geocode poorly; reduce them to the core city. */
export function normalizeLocationQuery(q: string): string {
  return q
    .replace(/^greater\s+/i, "")
    .replace(/\s+(metropolitan|metro|bay)\s+area$/i, "")
    .replace(/\s+metroplex$/i, "")
    .replace(/\s+area$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    type?: string;
    countrycode?: string;
  };
};

export function placeFromPhoton(f: PhotonFeature): Place {
  const p = f.properties;
  const city = p.type === "city" || p.type === "district" || p.type === "locality" ? (p.name ?? p.city ?? null) : (p.city ?? null);
  const region = p.type === "state" ? (p.name ?? null) : (p.state ?? null);
  const country = p.type === "country" ? (p.name ?? null) : (p.country ?? null);
  const label = [city, region, country].filter((x, i, a) => x && a.indexOf(x) === i).join(", ") || p.name || "";
  return { label, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], city, region, country };
}

const PHOTON = "https://photon.komoot.io/api/";

export async function searchPlaces(query: string, limit = 5): Promise<Place[]> {
  const q = normalizeLocationQuery(query);
  if (q.length < 2) return [];
  const run = async (layers: string[]) => {
    const url = new URL(PHOTON);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("lang", "en");
    for (const l of layers) url.searchParams.append("layer", l);
    const res = await fetch(url, {
      headers: { "User-Agent": "spheres-of-influence/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { features: PhotonFeature[] };
    return json.features.map(placeFromPhoton).filter((p) => p.label);
  };
  let places = await run(["city", "state", "country"]);
  if (places.length === 0) places = await run([]);
  const seen = new Set<string>();
  return places.filter((p) => (seen.has(p.label) ? false : (seen.add(p.label), true)));
}
