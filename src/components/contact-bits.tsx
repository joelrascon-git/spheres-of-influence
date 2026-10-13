import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORG_FIT, PERSONA_STATUS, PROGRAM_FIT, RESEARCH_CONFIDENCE, STATUS } from "@/lib/constants";

export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

export function ContactAvatar({
  name,
  path,
  size = 32,
  className,
  dimmed,
}: {
  name: string;
  path: string | null | undefined;
  size?: number;
  className?: string;
  dimmed?: boolean;
}) {
  const url = avatarUrl(path);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-medium text-muted-foreground ring-1 ring-foreground/10",
        dimmed && "opacity-50 grayscale",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- public storage URLs; next/image adds no value here
        <img src={url} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        initials || "?"
      )}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Working: "border-primary/40 text-primary",
  "Connected - F/U": "border-yellow-500/40 text-yellow-400",
  "Connected - Meeting Set": "border-blue-500/40 text-blue-400",
  "Connected - Relationship Made": "border-green-500/40 text-green-400",
  Nurture: "border-purple-500/40 text-purple-400",
  [STATUS.doNotContact]: "border-red-500/50 bg-red-500/10 text-red-400",
  [STATUS.gone]: "border-foreground/20 text-muted-foreground line-through",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] leading-none",
        STATUS_STYLES[status] ?? "border-foreground/20 text-muted-foreground",
        className,
      )}
    >
      {status}
    </span>
  );
}

export function PersonaBadge({ persona }: { persona: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded bg-accent px-1.5 py-0.5 text-[11px] leading-none text-accent-foreground">
      {persona}
    </span>
  );
}

export function TagChip({ name, color, onRemove }: { name: string; color: string; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] leading-none"
      style={{ borderColor: `${color}66`, color }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove tag ${name}`} className="ml-0.5 opacity-60 hover:opacity-100">
          ×
        </button>
      )}
    </span>
  );
}

export function KeyStar({ active, className }: { active: boolean; className?: string }) {
  return <Star className={cn("size-4", active ? "fill-primary text-primary" : "text-muted-foreground/50", className)} />;
}

// ───────────────────────── Second-brain badges ─────────────────────────

/** How grounded a claim is: green for primary sources, red only for never-checked. */
const RESEARCH_CONFIDENCE_STYLES: Record<string, string> = {
  confirmed: "border-green-500/40 bg-green-500/10 text-green-400",
  secondhand: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  unverified: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  inference: "border-foreground/20 bg-muted text-muted-foreground",
};

export function ConfidenceBadge({ confidence, className }: { confidence: string; className?: string }) {
  const label = RESEARCH_CONFIDENCE.find((c) => c.value === confidence)?.label ?? confidence;
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] leading-none",
        RESEARCH_CONFIDENCE_STYLES[confidence] ?? "border-foreground/20 text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Shared color scale for org fit (very_high…low) and program fit (very_strong…weak). */
const FIT_STYLES: Record<string, string> = {
  very_high: "border-green-500/40 bg-green-500/10 text-green-400",
  high: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  medium_high: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  medium_strong: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  low: "border-red-500/40 bg-red-500/10 text-red-400",
  weak: "border-red-500/40 bg-red-500/10 text-red-400",
};

export function FitBadge({ fit, className }: { fit: string | null | undefined; className?: string }) {
  if (!fit) return null;
  const label = [...ORG_FIT, ...PROGRAM_FIT].find((f) => f.value === fit)?.label ?? fit;
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] leading-none",
        FIT_STYLES[fit] ?? "border-foreground/20 text-muted-foreground",
        className,
      )}
      title="Factory fit"
    >
      {label}
    </span>
  );
}

const PERSONA_STATUS_STYLES: Record<string, string> = {
  assumed: "border-foreground/20 text-muted-foreground",
  indicated: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  validated: "border-green-500/40 bg-green-500/10 text-green-400",
};

/** How well-attested a contact's personas are: assumed from a title, or evidence-backed. */
export function PersonaStatusBadge({ status, className }: { status: string; className?: string }) {
  const def = PERSONA_STATUS.find((p) => p.value === status);
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] leading-none",
        PERSONA_STATUS_STYLES[status] ?? "border-foreground/20 text-muted-foreground",
        className,
      )}
      title={def?.hint}
    >
      Persona {def?.label.toLowerCase() ?? status}
    </span>
  );
}

export const isGone = (statuses: string[]) => statuses.includes(STATUS.gone);
export const isDnc = (statuses: string[]) => statuses.includes(STATUS.doNotContact);
