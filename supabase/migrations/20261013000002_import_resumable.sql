-- Spheres of Influence: resumable import apply.
-- Applies run as client-driven chunks; processed_at marks rows already written so an
-- interrupted apply resumes instead of redoing work or double-creating contacts.

alter table public.import_items add column processed_at timestamptz;
create index import_items_unprocessed_idx on public.import_items (batch_id, row_index)
  where processed_at is null;
