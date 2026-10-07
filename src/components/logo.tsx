import { cn } from "@/lib/utils";

/** Overlapping spheres: one node at the center of several circles of influence. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-6", className)} aria-hidden>
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <circle cx="12" cy="14" r="7.5" fill="none" stroke="#ef6f2e" strokeOpacity="0.7" strokeWidth="1.5" />
      <circle cx="20" cy="18" r="6" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="15.5" cy="16" r="2.5" fill="#ef6f2e" />
    </svg>
  );
}
