"use client";

import type { ReactNode } from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { ContactAvatar, KeyStar, PersonaBadge, PersonaStatusBadge, StatusBadge } from "@/components/contact-bits";
import { SENIORITY_LEVELS } from "@/lib/constants";
import type { ContactRef } from "@/lib/data";

/**
 * Hover over any contact chip to see who they are — name, title, level, personas
 * and status — without leaving the page. The popover follows its trigger and
 * closes as soon as the pointer leaves either element.
 */
export function ContactHoverCard({ contact, children }: { contact: ContactRef; children: ReactNode }) {
  const level = SENIORITY_LEVELS.find((l) => l.value === contact.seniority_level);
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger
        render={(props) => (
          <span {...props} className="inline-flex min-w-0 max-w-full items-center">
            {children}
          </span>
        )}
      />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side="top" align="center" sideOffset={6} className="z-50 outline-none">
          <TooltipPrimitive.Popup className="w-72 rounded-lg border bg-card p-3 text-card-foreground shadow-xl">
            <div className="flex items-center gap-2">
              <ContactAvatar name={contact.full_name} path={contact.avatar_path} size={36} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate text-sm font-semibold">
                  {contact.full_name}
                  {contact.is_key && <KeyStar active className="size-3.5" />}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{contact.title ?? "No title on file"}</p>
              </div>
            </div>
            <dl className="mt-2.5 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <dt className="w-14 shrink-0 text-muted-foreground">Level</dt>
                <dd className="min-w-0 flex-1">
                  {contact.seniority_level ? (
                    <span title={level?.label}>{level?.label ?? contact.seniority_level}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="w-14 shrink-0 text-muted-foreground">Persona</dt>
                <dd className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {contact.personas.length ? (
                    contact.personas.map((p) => <PersonaBadge key={p} persona={p} />)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                  {contact.persona_status && <PersonaStatusBadge status={contact.persona_status} />}
                </dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="w-14 shrink-0 text-muted-foreground">Status</dt>
                <dd className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {contact.statuses.length ? (
                    contact.statuses.map((s) => <StatusBadge key={s} status={s} />)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              {contact.influence_score != null && (
                <div className="flex items-start gap-2">
                  <dt className="w-14 shrink-0 text-muted-foreground">Influence</dt>
                  <dd className="flex flex-1 items-center gap-1.5">
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted" title={`Influence score ${contact.influence_score}/100`}>
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${contact.influence_score}%` }} />
                    </span>
                    <span className="tabular-nums text-muted-foreground">{contact.influence_score}/100</span>
                  </dd>
                </div>
              )}
            </dl>
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
