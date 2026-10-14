-- ───────────────────────── Inference undo ─────────────────────────
-- Accepting a proposal stores the prior state it overwrote, so the review
-- queue's undo restores the record exactly. After an undo the proposal returns
-- to pending; the activity log keeps both halves of the audit trail.
alter table public.inferences add column undo jsonb;
