"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, MapPin, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RichTextEditor } from "@/components/rich-text";
import { QUALITY, type Quality } from "@/lib/constants";
import type { Place } from "@/lib/geocode";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string; hint?: string; color?: string };

export const toOptions = (values: readonly string[]): Option[] => values.map((v) => ({ value: v, label: v }));

const triggerClass =
  "flex min-h-8 w-full items-center gap-1.5 rounded-md border bg-input/20 px-2 py-1 text-left text-sm hover:bg-input/40 focus-visible:border-ring focus-visible:outline-none";

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  renderChip,
  className,
  onCreate,
  createLabel,
}: {
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  renderChip?: (o: Option) => React.ReactNode;
  className?: string;
  onCreate?: (query: string) => void;
  createLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const byValue = new Map(options.map((o) => [o.value, o]));
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const exact = options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button type="button" className={cn(triggerClass, className)} />}>
        <div className="flex flex-1 flex-wrap gap-1">
          {value.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
          {value.map((v) => {
            const o = byValue.get(v) ?? { value: v, label: v };
            return renderChip ? (
              <span key={v}>{renderChip(o)}</span>
            ) : (
              <span key={v} className="inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs">
                {o.label}
              </span>
            );
          })}
        </div>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.value} value={o.label} onSelect={() => toggle(o.value)}>
                  <Check className={cn("size-3.5", value.includes(o.value) ? "opacity-100 text-primary" : "opacity-0")} />
                  {o.color && <span className="size-2 rounded-full" style={{ background: o.color }} />}
                  <span className="flex-1 truncate">{o.label}</span>
                </CommandItem>
              ))}
              {onCreate && query.trim() && !exact && (
                <CommandItem
                  value={`__create__${query}`}
                  onSelect={() => {
                    onCreate(query.trim());
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="text-primary">+ {createLabel ?? "Create"} “{query.trim()}”</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function SingleSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  allowClear = true,
  className,
  searchable = false,
}: {
  options: Option[];
  value: string | null;
  onChange: (next: string | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  className?: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button type="button" className={cn(triggerClass, className)} />}>
        <span className={cn("flex-1 truncate", !current && "text-muted-foreground")}>
          {current?.label ?? (value ? value : placeholder)}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          {(searchable || options.length > 8) && <CommandInput placeholder="Search…" />}
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup>
              {allowClear && value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <X className="size-3.5" /> <span className="text-muted-foreground">Clear</span>
                </CommandItem>
              )}
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={`${o.label} ${o.hint ?? ""}`}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-3.5", value === o.value ? "opacity-100 text-primary" : "opacity-0")} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{o.label}</div>
                    {o.hint && <div className="truncate text-xs text-muted-foreground">{o.hint}</div>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function DateField({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? parseISO(value) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button type="button" className={cn(triggerClass, className)} />}>
        <CalendarIcon className="size-3.5 text-muted-foreground" />
        <span className={cn("flex-1", !date && "text-muted-foreground")}>{date ? format(date, "MMM d, yyyy") : placeholder}</span>
        {value && (
          <span
            role="button"
            aria-label="Clear date"
            className="text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            <X className="size-3.5" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : null);
            setOpen(false);
          }}
        />
        <div className="flex justify-between border-t p-2">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => {
              onChange(format(new Date(), "yyyy-MM-dd"));
              setOpen(false);
            }}
          >
            Today
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Click to cycle Good → Questionable → Bad → unset. */
export function QualityDot({ value, onChange, label }: { value: Quality | null; onChange: (q: Quality | null) => void; label: string }) {
  const order: (Quality | null)[] = ["good", "questionable", "bad", null];
  const next = order[(order.indexOf(value) + 1) % order.length];
  const q = QUALITY.find((x) => x.value === value);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={`${label} quality: ${q?.label ?? "Unknown"}. Click to change.`}
            onClick={() => onChange(next)}
            className="flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-accent"
          />
        }
      >
        <span className={cn("size-2.5 rounded-full ring-1 ring-foreground/20", q ? q.color : "bg-transparent")} />
      </TooltipTrigger>
      <TooltipContent>
        {label}: {q?.label ?? "Not rated"} · click to change
      </TooltipContent>
    </Tooltip>
  );
}

export function QualityIndicator({ value }: { value: Quality | null }) {
  const q = QUALITY.find((x) => x.value === value);
  if (!q) return null;
  return <span title={q.label} className={cn("inline-block size-2 shrink-0 rounded-full", q.color)} />;
}

/** Text that turns into an input on click and saves on blur or Enter. */
export function InlineText({
  value,
  onSave,
  placeholder = "Add…",
  multiline = false,
  className,
  inputClassName,
  type = "text",
}: {
  value: string | null;
  onSave: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if ((value ?? "") !== draft.trim()) onSave(draft.trim());
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value ?? "");
          setEditing(true);
        }}
        className={cn(
          "w-full rounded px-1 -mx-1 text-left hover:bg-accent/60",
          !value && "text-muted-foreground",
          multiline && "whitespace-pre-wrap",
          className,
        )}
      >
        {value || placeholder}
      </button>
    );
  }
  const shared = {
    ref,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setDraft(value ?? "");
        setEditing(false);
      }
      if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        commit();
      }
    },
    className: cn("w-full rounded-md border bg-input/20 px-2 py-1 text-sm outline-none focus:border-ring", inputClassName),
  };
  return multiline ? <textarea rows={4} {...shared} /> : <input type={type} {...shared} />;
}

/**
 * Rich text as an inline form field: a small borderless editor that saves on blur.
 * Use RichTextEditor directly when you need the toolbar (e.g. notes).
 */
export function RichTextField({
  value,
  onChange,
  onSave,
  placeholder,
  className,
  minHeight = "min-h-16",
  toolbar = false,
}: {
  value: string | null;
  onChange?: (html: string) => void;
  onSave?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  toolbar?: boolean;
}) {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      onBlur={onSave}
      placeholder={placeholder}
      className={className}
      minHeight={minHeight}
      toolbar={toolbar}
    />
  );
}

/** One-box location entry with autocomplete ("phx" → "Phoenix, Arizona, United States"). */
export function LocationInput({
  value,
  onSelect,
  placeholder = "City, region or country",
  className,
}: {
  value: string | null;
  onSelect: (text: string, place: Place | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState(value ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Adjust state during render when the server pushes a new location (React's recommended pattern).
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    setQuery(value ?? "");
  }

  const search = (q: string) => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          setResults((await res.json()).places ?? []);
          setActive(0);
        }
      });
    }, 250);
  };

  const choose = (p: Place | null) => {
    const text = p?.label ?? query.trim();
    setQuery(text);
    setOpen(false);
    if (text !== (value ?? "")) onSelect(text, p);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-1.5 rounded-md border bg-input/20 px-2 focus-within:border-ring">
        <MapPin className="size-3.5 text-muted-foreground" />
        <input
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            search(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          // Suggestions use onMouseDown preventDefault, so blur only fires when leaving the field.
          onBlur={() => choose(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            if (e.key === "Enter") {
              e.preventDefault();
              choose(results[active] ?? null);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          className="h-8 w-full bg-transparent text-sm outline-none"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
          {results.map((p, i) => (
            <li key={p.label}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(p)}
                className={cn("w-full px-2.5 py-1.5 text-left text-sm hover:bg-accent", i === active && "bg-accent")}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
