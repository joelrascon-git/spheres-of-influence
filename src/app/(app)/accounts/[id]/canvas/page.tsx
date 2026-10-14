import { redirect } from "next/navigation";

/** The canvas lives at /canvas; old per-account links keep working. */
export default async function AccountCanvasRedirect({ params }: PageProps<"/accounts/[id]/canvas">) {
  const { id } = await params;
  redirect(`/canvas?account=${encodeURIComponent(id)}`);
}
