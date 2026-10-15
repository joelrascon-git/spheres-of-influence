import { describe, expect, it } from "vitest";
import { cityKeyOf, cityPins, emailsOf, type MapPerson } from "@/lib/map/pins";

const person = (id: string, extra: Partial<MapPerson> = {}): MapPerson => ({
  id,
  full_name: `Person ${id}`,
  title: null,
  avatar_path: null,
  email: null,
  location: null,
  location_city: null,
  location_region: null,
  location_country: null,
  location_lat: null,
  location_lng: null,
  account_id: null,
  org_id: null,
  influence_score: null,
  is_key: false,
  statuses: [],
  personas: [],
  seniority_level: null,
  ...extra,
});

describe("cityPins", () => {
  it("puts one pin per city, counting and centering the people there", () => {
    const { pins, unmapped } = cityPins([
      person("a", { location_city: "Phoenix", location_lat: 33.4, location_lng: -112 }),
      person("b", { location_city: "Phoenix", location_lat: 33.6, location_lng: -112.2 }),
      person("c", { location_city: "NYC", location: "New York, NY", location_lat: 40.7, location_lng: -74 }),
    ]);
    expect(unmapped).toBe(0);
    expect(pins).toHaveLength(2);
    const phoenix = pins.find((p) => p.city === "Phoenix")!;
    expect(phoenix.count).toBe(2);
    expect(phoenix.lat).toBeCloseTo(33.5);
    expect(pins[0].count).toBeGreaterThanOrEqual(pins[1].count); // busiest city first
  });

  it("falls back to the raw location text and counts unlocated people off the map", () => {
    const { pins, unmapped } = cityPins([
      person("a", { location: "Scottsdale, Arizona", location_lat: 33.5, location_lng: -111.9 }),
      person("b", { location_city: "Somewhere" }),
      person("c"),
    ]);
    expect(pins).toHaveLength(1);
    expect(pins[0].city).toBe("Scottsdale, Arizona");
    expect(unmapped).toBe(2);
  });

  it("groups the same city regardless of case or surrounding whitespace", () => {
    const { pins } = cityPins([
      person("a", { location_city: "Phoenix", location_lat: 1, location_lng: 1 }),
      person("b", { location_city: " PHOENIX ", location_lat: 1, location_lng: 2 }),
    ]);
    expect(pins).toHaveLength(1);
    expect(pins[0].count).toBe(2);
  });
});

describe("cityKeyOf", () => {
  it("prefers the city, then the raw text, then a placeholder", () => {
    expect(cityKeyOf({ location_city: "Phoenix", location: "x" })).toBe("phoenix");
    expect(cityKeyOf({ location_city: null, location: "Phoenix, AZ" })).toBe("phoenix, az");
    expect(cityKeyOf({ location_city: null, location: null })).toBe("unknown");
  });
});

describe("emailsOf", () => {
  it("collects unique, non-empty emails, case-insensitively", () => {
    expect(
      emailsOf([
        person("a", { email: "A@x.com" }),
        person("b", { email: "a@x.com" }),
        person("c", { email: " " }),
        person("d", { email: null }),
        person("e", { email: "b@x.com" }),
      ]),
    ).toEqual(["a@x.com", "b@x.com"]);
  });
});
