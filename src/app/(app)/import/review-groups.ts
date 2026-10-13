/**
 * Shared review-group definitions for import review: the same filters drive the
 * tabs, the paginated queries and the bulk actions, so counts can never drift.
 */
export type ReviewGroup = "review" | "update" | "create" | "unchanged" | "error" | "skipped";

export type GroupSpec = {
  key: ReviewGroup;
  label: string;
  hint?: string;
  eq?: [string, string][];
  neq?: [string, string][];
  /** PostgREST or-expression for the groups that need one. */
  or?: string;
};

export const REVIEW_GROUPS: GroupSpec[] = [
  {
    key: "review",
    label: "Needs your call",
    hint: "Rows that share a name with an existing contact but not a LinkedIn ID or email. Match them, or import them as new.",
    eq: [["action", "review"]],
    neq: [
      ["decision", "skip"],
      ["decision", "merge"],
    ],
  },
  {
    key: "update",
    label: "Updates",
    hint: "Matched contacts with changes. Uncheck any change you don't want.",
    or: "decision.eq.merge,and(action.eq.update,decision.neq.skip)",
  },
  { key: "create", label: "New contacts", eq: [["action", "create"]], neq: [["decision", "skip"]] },
  {
    key: "unchanged",
    label: "No changes",
    hint: "No profile changes. Importing still refreshes photos, links and connection counts.",
    eq: [["action", "unchanged"]],
    neq: [["decision", "skip"]],
  },
  { key: "error", label: "Rows with problems", eq: [["action", "error"]] },
  { key: "skipped", label: "Skipped", eq: [["decision", "skip"]] },
];

export const groupSpec = (key: string): GroupSpec | undefined => REVIEW_GROUPS.find((g) => g.key === key);

/** Apply one group's filters to a query builder. The loose method returns keep
 *  supabase's deeply generic builders out of type inference. */
export function withGroup<
  Q extends { eq(c: string, v: string): unknown; neq(c: string, v: string): unknown; or(f: string): unknown },
>(query: Q, spec: GroupSpec): Q {
  let q = query;
  for (const [column, value] of spec.eq ?? []) q = q.eq(column, value) as Q;
  for (const [column, value] of spec.neq ?? []) q = q.neq(column, value) as Q;
  if (spec.or) q = q.or(spec.or) as Q;
  return q;
}
