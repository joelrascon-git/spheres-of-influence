import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS } from "@/lib/constants";

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

export const isGone = (statuses: string[]) => statuses.includes(STATUS.gone);
export const isDnc = (statuses: string[]) => statuses.includes(STATUS.doNotContact);
