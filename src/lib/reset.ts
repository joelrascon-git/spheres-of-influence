/**
 * The one-click demo reset: the root tables to wipe, in dependency-safe
 * order. Children cascade from these (orgs, notes, links, influence edges and
 * qualification boards all go with their account, contact or campaign), and
 * workspace configuration — field definitions, prompts, style rules, the
 * persona catalog — is deliberately left alone. Proposals are deleted before
 * documents because they are designed to outlive their source document.
 * Contacts are listed explicitly: their account and org FKs are set-null by
 * design (people survive a removed company), so the reset must name them.
 */
export const WIPE_TABLES = [
  "inferences",
  "documents",
  "import_batches",
  "research_docs",
  "hypotheses",
  "signals",
  "campaigns",
  "opportunities",
  "tasks",
  "accounts",
  "contacts",
  "tags",
  "activity_log",
] as const;
