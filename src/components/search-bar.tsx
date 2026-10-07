"use client";

import { useState } from "react";
import { HelpCircle, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const EXAMPLES: [string, string][] = [
  ["manager AND AI", "Both words anywhere in the profile, notes or tags"],
  ['"machine learning" OR ML', "Exact phrase, or a word"],
  ["(snowflake OR databricks) -intern", "Group with parentheses; - or NOT excludes"],
  ["title:director", "Only search one field"],
  ['-status:"Do Not Contact"', "Exclude a status"],
  ["data*", "Prefix: data, database, datadog…"],
  ["is:key has:email contacted:no", "Shortcuts"],
];

const FIELDS =
  "name, title, headline, summary, job, location, notes, tag, email, industry, org, account, status, persona, seniority";

export function SearchBar({
  value,
  onSubmit,
  placeholder = "Search contacts… (boolean: AND, OR, NOT, \"phrases\", field:value)",
  className,
}: {
  value: string;
  onSubmit: (q: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  // Adjust state during render when the server pushes a new query (React's recommended pattern).
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    setDraft(value);
  }

  return (
    <form
      className={cn("flex items-center gap-2 rounded-md border bg-input/20 px-2.5 focus-within:border-ring", className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft.trim());
      }}
    >
      <Search className="size-4 text-muted-foreground" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="h-9 flex-1 bg-transparent font-mono text-[13px] outline-none placeholder:font-sans"
        spellCheck={false}
      />
      {draft && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setDraft("");
            onSubmit("");
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
      <Popover>
        <PopoverTrigger render={<button type="button" aria-label="Search syntax help" className="text-muted-foreground hover:text-foreground" />}>
          <HelpCircle className="size-4" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[26rem]">
          <p className="text-sm font-medium">Search syntax</p>
          <ul className="space-y-1.5">
            {EXAMPLES.map(([q, d]) => (
              <li key={q} className="flex flex-col">
                <button
                  type="button"
                  className="self-start font-mono text-xs text-primary hover:underline"
                  onClick={() => {
                    setDraft(q);
                    onSubmit(q);
                  }}
                >
                  {q}
                </button>
                <span className="text-xs text-muted-foreground">{d}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Fields: <span className="font-mono">{FIELDS}</span>. Operators must be uppercase. Words match whole words, so “AI” won’t match “maintain”.
          </p>
        </PopoverContent>
      </Popover>
    </form>
  );
}
