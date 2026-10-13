"use client";

import { useState } from "react";
import { Check, ChevronDown, FilterX } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { Facets } from "@/lib/search/parse";
import { countFacets } from "@/lib/search/url";
import { SENIORITY, SENIORITY_LEVELS, PERSONA_STATUS, CHAMPION_FLAG } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Opt = { value: string; label: string; hint?: string; color?: string };

function FacetPill({
  label,
  options,
  value,
  onChange,
  exclude,
  onExcludeChange,
}: {
  label: string;
  options: Opt[];
  value: string[];
  onChange: (v: string[]) => void;
  exclude?: string[];
  onExcludeChange?: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const inc = new Set(value);
  const exc = new Set(exclude ?? []);
  const active = inc.size + exc.size;
  const summary =
    active === 0
      ? label
      : active === 1
        ? `${label}: ${exc.size ? "not " : ""}${options.find((o) => inc.has(o.value) || exc.has(o.value))?.label ?? "1"}`
        : `${label}: ${active}`;

  // Cycles include → exclude → off when exclusion is supported.
  const cycle = (v: string) => {
    if (inc.has(v)) {
      onChange(value.filter((x) => x !== v));
      if (onExcludeChange) onExcludeChange([...(exclude ?? []), v]);
    } else if (exc.has(v)) {
      onExcludeChange?.((exclude ?? []).filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground",
              active > 0 && "border-primary/50 bg-primary/10 text-foreground",
            )}
          />
        }
      >
        <span className="max-w-48 truncate">{summary}</span>
        <ChevronDown className="size-3" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          {options.length > 6 && <CommandInput placeholder={`Filter ${label.toLowerCase()}…`} />}
          <CommandList>
            <CommandEmpty>No options.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const state = inc.has(o.value) ? "inc" : exc.has(o.value) ? "exc" : "off";
                return (
                  <CommandItem key={o.value} value={`${o.label} ${o.hint ?? ""}`} onSelect={() => cycle(o.value)}>
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded border text-[10px]",
                        state === "inc" && "border-primary bg-primary text-primary-foreground",
                        state === "exc" && "border-red-500 bg-red-500/20 text-red-400",
                      )}
                    >
                      {state === "inc" && <Check className="size-3" />}
                      {state === "exc" && "−"}
                    </span>
                    {o.color && <span className="size-2 rounded-full" style={{ background: o.color }} />}
                    <span className={cn("flex-1 truncate", state === "exc" && "line-through")}>{o.label}</span>
                    {o.hint && <span className="truncate text-xs text-muted-foreground">{o.hint}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {onExcludeChange && (
          <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">Click once to include, twice to exclude.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground",
        active && "border-primary/50 bg-primary/10 text-foreground",
      )}
    >
      {label}
    </button>
  );
}

export type FacetSources = {
  accounts: { id: string; name: string }[];
  orgs: { id: string; name: string; account_id: string }[];
  tags: { id: string; name: string; color: string }[];
  personas: string[];
  statuses: string[];
  cities: string[];
};

export function FacetBar({ facets, onChange, sources }: { facets: Facets; onChange: (f: Facets) => void; sources: FacetSources }) {
  const set = <K extends keyof Facets>(k: K, v: Facets[K]) => onChange({ ...facets, [k]: v });
  const accountName = new Map(sources.accounts.map((a) => [a.id, a.name]));
  const orgOptions = sources.orgs
    .filter((o) => !facets.accountIds?.length || facets.accountIds.includes(o.account_id))
    .map((o) => ({ value: o.id, label: o.name, hint: accountName.get(o.account_id) }));
  const n = countFacets(facets);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sources.accounts.length > 1 && (
        <FacetPill
          label="Account"
          options={sources.accounts.map((a) => ({ value: a.id, label: a.name }))}
          value={facets.accountIds ?? []}
          onChange={(v) => set("accountIds", v)}
        />
      )}
      <FacetPill label="Org" options={orgOptions} value={facets.orgIds ?? []} onChange={(v) => set("orgIds", v)} />
      <FacetPill
        label="Seniority"
        options={SENIORITY.map((s) => ({ value: s.value, label: s.label }))}
        value={facets.seniority ?? []}
        onChange={(v) => set("seniority", v)}
      />
      <FacetPill
        label="Level"
        options={SENIORITY_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
        value={facets.seniorityLevels ?? []}
        onChange={(v) => set("seniorityLevels", v)}
      />
      <FacetPill
        label="Persona"
        options={sources.personas.map((p) => ({ value: p, label: p }))}
        value={facets.personas ?? []}
        onChange={(v) => set("personas", v)}
      />
      <FacetPill
        label="Persona status"
        options={PERSONA_STATUS.map((p) => ({ value: p.value, label: p.label, hint: p.hint }))}
        value={facets.personaStatuses ?? []}
        onChange={(v) => set("personaStatuses", v)}
      />
      <FacetPill
        label="Champion"
        options={CHAMPION_FLAG.map((c) => ({ value: c.value, label: c.label }))}
        value={facets.championFlags ?? []}
        onChange={(v) => set("championFlags", v)}
      />
      <FacetPill
        label="Status"
        options={sources.statuses.map((s) => ({ value: s, label: s }))}
        value={facets.statuses ?? []}
        onChange={(v) => set("statuses", v)}
        exclude={facets.excludeStatuses ?? []}
        onExcludeChange={(v) => set("excludeStatuses", v)}
      />
      <FacetPill
        label="Tag"
        options={sources.tags.map((t) => ({ value: t.id, label: t.name, color: t.color }))}
        value={facets.tagIds ?? []}
        onChange={(v) => set("tagIds", v)}
        exclude={facets.excludeTagIds ?? []}
        onExcludeChange={(v) => set("excludeTagIds", v)}
      />
      <FacetPill
        label="City"
        options={sources.cities.map((c) => ({ value: c.toLowerCase(), label: c }))}
        value={facets.cities ?? []}
        onChange={(v) => set("cities", v)}
      />
      <Toggle label="★ Key" active={!!facets.keyOnly} onClick={() => set("keyOnly", !facets.keyOnly || undefined)} />
      <Toggle label="Can veto" active={!!facets.canVeto} onClick={() => set("canVeto", !facets.canVeto || undefined)} />
      <Toggle label="Has email" active={!!facets.hasEmail} onClick={() => set("hasEmail", !facets.hasEmail || undefined)} />
      <Toggle label="No org" active={!!facets.noOrg} onClick={() => set("noOrg", !facets.noOrg || undefined)} />
      <Toggle
        label="Change agents"
        active={!!facets.changeAgents}
        onClick={() => set("changeAgents", !facets.changeAgents || undefined)}
      />
      <Toggle
        label="Not contacted 30d+"
        active={facets.notContactedDays === 30}
        onClick={() => set("notContactedDays", facets.notContactedDays === 30 ? undefined : 30)}
      />
      {n > 0 && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="inline-flex h-7 items-center gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <FilterX className="size-3.5" /> Clear {n}
        </button>
      )}
    </div>
  );
}
