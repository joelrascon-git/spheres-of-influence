import type { Facets } from "@/lib/search/parse";

type Params = Record<string, string | string[] | undefined>;

const LIST_KEYS = {
  account: "accountIds",
  org: "orgIds",
  sen: "seniority",
  persona: "personas",
  status: "statuses",
  xstatus: "excludeStatuses",
  tag: "tagIds",
  xtag: "excludeTagIds",
  city: "cities",
} as const satisfies Record<string, keyof Facets>;

const FLAG_KEYS = {
  key: "keyOnly",
  email: "hasEmail",
  mgr: "hasManager",
  noorg: "noOrg",
  agent: "changeAgents",
} as const satisfies Record<string, keyof Facets>;

const all = (v: string | string[] | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v]).flatMap((x) => x.split(",")).filter(Boolean);

export function facetsFromParams(p: Params): Facets {
  const f: Facets = {};
  for (const [param, key] of Object.entries(LIST_KEYS)) {
    const v = all(p[param]);
    if (v.length) (f as Record<string, unknown>)[key] = v;
  }
  for (const [param, key] of Object.entries(FLAG_KEYS)) {
    if (all(p[param])[0] === "1") (f as Record<string, unknown>)[key] = true;
  }
  const nc = Number(all(p.nc)[0]);
  if (Number.isFinite(nc) && nc > 0) f.notContactedDays = nc;
  return f;
}

export function facetsToParams(f: Facets, base = new URLSearchParams()): URLSearchParams {
  const p = new URLSearchParams(base);
  for (const [param, key] of Object.entries(LIST_KEYS)) {
    p.delete(param);
    const v = f[key] as string[] | undefined;
    if (v?.length) p.set(param, v.join(","));
  }
  for (const [param, key] of Object.entries(FLAG_KEYS)) {
    p.delete(param);
    if (f[key]) p.set(param, "1");
  }
  p.delete("nc");
  if (f.notContactedDays) p.set("nc", String(f.notContactedDays));
  return p;
}

export function countFacets(f: Facets): number {
  let n = 0;
  for (const key of Object.values(LIST_KEYS)) if ((f[key] as string[] | undefined)?.length) n++;
  for (const key of Object.values(FLAG_KEYS)) if (f[key]) n++;
  if (f.notContactedDays) n++;
  return n;
}
