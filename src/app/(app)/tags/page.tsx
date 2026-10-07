import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { listTagCounts, listTags } from "@/lib/data";
import { TagsManager } from "./tags-manager";

export default async function TagsPage() {
  const { supabase } = await requireUser();
  const [tags, countList] = await Promise.all([listTags(supabase), listTagCounts(supabase)]);
  const counts: Record<string, number> = {};
  for (const [id, n] of countList) counts[id] = n;

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Tags"
        description="Slices of your people. Every tag needs a description so you remember why it exists."
      />
      <TagsManager tags={tags} counts={counts} />
    </div>
  );
}
