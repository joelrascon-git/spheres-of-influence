"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, X } from "lucide-react";
import type { Map as LeafletMap, LayerGroup, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search-bar";
import { FacetBar } from "@/components/facet-bar";
import { ContactAvatar, KeyStar } from "@/components/contact-bits";
import { cityKeyOf, cityPins, emailsOf, type CityPin, type MapPerson } from "@/lib/map/pins";
import { facetsToParams } from "@/lib/search/url";
import type { Facets } from "@/lib/search/parse";
import type { Tag } from "@/lib/types";

type Props = {
  query: string;
  facets: Facets;
  people: MapPerson[];
  total: number;
  error?: string;
  accounts: { id: string; name: string }[];
  orgs: { id: string; name: string; account_id: string }[];
  tags: Tag[];
  personas: string[];
  statuses: string[];
  cities: string[];
};

/** HTML-escape names before they go into a Leaflet popup string. */
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function MapView({ query, facets, people, total, error, accounts, orgs, tags, personas, statuses, cities }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { pins, unmapped } = useMemo(() => cityPins(people), [people]);
  const accountName = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  /** Names per city for pin popups; only mapped people appear on pins. */
  const namesByCity = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of people) {
      if (p.location_lat == null || p.location_lng == null) continue;
      const k = cityKeyOf(p);
      const list = m.get(k) ?? [];
      list.push(p.full_name);
      m.set(k, list);
    }
    return m;
  }, [people]);
  /** The cohort list: the whole filtered set, or one city when a pin is picked. */
  const shown = useMemo(
    () => (selectedCity ? people.filter((p) => cityKeyOf(p) === selectedCity) : people),
    [people, selectedCity],
  );

  const go = (patch: { q?: string; facets?: Facets }) => {
    const p = facetsToParams(patch.facets ?? facets);
    const q = patch.q !== undefined ? patch.q : query;
    if (q) p.set("q", q);
    startTransition(() => router.push(`/map${p.size ? `?${p}` : ""}`, { scroll: false }));
  };

  // ── Leaflet wiring ──
  const hostRef = useRef<HTMLDivElement>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const lastFitSig = useRef("");

  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;
    void (async () => {
      const mod = await import("leaflet");
      const L = (("default" in mod && mod.default ? mod.default : mod) as typeof import("leaflet"));
      if (cancelled || !hostRef.current || mapRef.current) return;
      const map = L.map(hostRef.current, { worldCopyJump: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);
      map.setView([25, 5], 2);
      LRef.current = L;
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      markers.clear();
      setMapReady(false);
    };
  }, []);

  // One marker per city; clicking a pin selects that city's cohort in the list.
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!mapReady || !L || !map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();
    for (const pin of pins) {
      const icon = L.divIcon({
        className: "",
        html: `<div class="so-pin${selectedCity === pin.key ? " so-pin-on" : ""}">${pin.count}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      const names = namesByCity.get(pin.key) ?? [];
      const more = names.length > 5 ? `<p class="text-[11px] text-muted-foreground">… ${names.length - 5} more in the list</p>` : "";
      const marker = L.marker([pin.lat, pin.lng], { icon, title: pin.city }).bindPopup(
        `<p class="text-sm font-semibold">${esc(pin.city)} — ${pin.count} ${pin.count === 1 ? "person" : "people"}</p>` +
          names.slice(0, 5).map((n) => `<p class="text-xs text-muted-foreground">${esc(n)}</p>`).join("") +
          more,
      );
      marker.on("click", () => setSelectedCity((cur) => (cur === pin.key ? null : pin.key)));
      marker.addTo(layer);
      markersRef.current.set(pin.key, marker);
    }
    // Fit only when the pin set itself changes, so picking a pin doesn't re-zoom.
    const sig = pins.map((p) => p.key).join("|");
    if (sig !== lastFitSig.current) {
      lastFitSig.current = sig;
      if (pins.length) map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 11 });
      else map.setView([25, 5], 2);
    }
    if (selectedCity) markersRef.current.get(selectedCity)?.openPopup();
  }, [mapReady, pins, namesByCity, selectedCity]);

  /** Fly to a person's city and pop its pin open. */
  const focusPerson = (p: MapPerson) => {
    const pin = pins.find((x) => x.key === cityKeyOf(p));
    const map = mapRef.current;
    if (!pin || !map) return;
    setSelectedCity(pin.key);
    map.flyTo([pin.lat, pin.lng], Math.max(map.getZoom(), 11), { duration: 0.5 });
  };

  const copyEmails = async () => {
    const emails = emailsOf(shown);
    if (emails.length === 0) {
      toast.info("No emails in this cohort.");
      return;
    }
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      toast.success(`Copied ${emails.length} email${emails.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Couldn't reach the clipboard.");
    }
  };

  const selectedPin: CityPin | undefined = selectedCity ? pins.find((p) => p.key === selectedCity) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Search + facets: the same cohort builder as the contacts page */}
      <div className="space-y-2 border-b px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchBar className="min-w-64 flex-1" value={query} onSubmit={(q) => go({ q })} />
          <span className="text-xs text-muted-foreground">
            {pending
              ? "Updating…"
              : error
                ? <span className="text-destructive">Search error: {error}</span>
                : `${total.toLocaleString()} ${total === 1 ? "person" : "people"} · ${pins.length} ${pins.length === 1 ? "city" : "cities"}${unmapped ? ` · ${unmapped} without location` : ""}`}
          </span>
          <Button variant="outline" size="sm" onClick={() => void copyEmails()}>
            <Copy className="size-3.5" /> Copy emails
          </Button>
        </div>
        <FacetBar
          facets={facets}
          onChange={(f) => go({ facets: f })}
          sources={{ accounts, orgs, tags, personas, statuses, cities }}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* The map */}
        <div className="relative min-w-0 flex-1">
          <div ref={hostRef} className="absolute inset-0" />
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-sm text-muted-foreground">
              Loading the map…
            </div>
          )}
          {selectedPin && (
            <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg border bg-card/95 px-2.5 py-1.5 text-xs shadow-lg">
              <span>
                <strong>{selectedPin.city}</strong> — {selectedPin.count} {selectedPin.count === 1 ? "person" : "people"}
              </span>
              <button type="button" aria-label="Clear city" onClick={() => setSelectedCity(null)} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Cohort list */}
        <aside className="flex w-80 shrink-0 flex-col border-l bg-card/40">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {selectedPin ? `In ${selectedPin.city}` : "Cohort"}
            </p>
            <span className="text-xs tabular-nums text-muted-foreground">{shown.length}</span>
          </div>
          <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
            {shown.map((p) => (
              <li key={p.id} className="group flex items-center gap-2 px-3 py-2 hover:bg-accent/50">
                <button type="button" onClick={() => focusPerson(p)} className="flex min-w-0 flex-1 items-center gap-2 text-left" title={`${p.location_city ?? p.location ?? "No location"} — show on map`}>
                  <ContactAvatar name={p.full_name} path={p.avatar_path} size={26} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 truncate text-xs font-medium">
                      <span className="truncate">{p.full_name}</span>
                      {p.is_key && <KeyStar active className="size-3 shrink-0" />}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {p.title ?? "No title"}
                      {p.account_id && accountName.get(p.account_id) ? ` · ${accountName.get(p.account_id)}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 max-w-24 truncate text-right text-[11px] text-muted-foreground">
                    {p.location_city ?? p.location ?? "—"}
                  </span>
                </button>
                <Link
                  href={`/contacts/${p.id}`}
                  aria-label={`Open ${p.full_name}'s profile`}
                  className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                >
                  <ExternalLink className="size-3.5" />
                </Link>
              </li>
            ))}
            {shown.length === 0 && (
              <li className="p-4 text-xs text-muted-foreground">No contacts match this cohort.</li>
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}
