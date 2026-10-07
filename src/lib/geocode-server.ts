import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeLocationQuery, searchPlaces, type Place } from "@/lib/geocode";

/** Geocodes a free-text location through the shared cache. Returns null if nothing matches. */
export async function geocodeCached(supabase: SupabaseClient, text: string | null): Promise<Place | null> {
  if (!text?.trim()) return null;
  const key = text.trim().toLowerCase();
  const { data: hit } = await supabase.from("geocode_cache").select("*").eq("query", key).maybeSingle();
  if (hit) return hit.lat == null ? null : (hit as Place);

  let place: Place | null = null;
  try {
    place = (await searchPlaces(text, 1))[0] ?? null;
    if (!place && normalizeLocationQuery(text) !== text) place = (await searchPlaces(normalizeLocationQuery(text), 1))[0] ?? null;
  } catch {
    return null; // Network failure: don't cache, try again next time.
  }
  // Misses are cached too so a bad location isn't re-queried on every import.
  await supabase.from("geocode_cache").upsert({
    query: key,
    label: place?.label ?? null,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    city: place?.city ?? null,
    region: place?.region ?? null,
    country: place?.country ?? null,
  });
  return place;
}

export function placeColumns(place: Place | null) {
  return {
    location_lat: place?.lat ?? null,
    location_lng: place?.lng ?? null,
    location_city: place?.city ?? null,
    location_region: place?.region ?? null,
    location_country: place?.country ?? null,
  };
}
