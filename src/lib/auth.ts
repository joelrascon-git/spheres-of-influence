import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/env";
import { ensureDefaults } from "@/lib/defaults-seed";

export const requireUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");
  if (!isEmailAllowed(user.email)) {
    await supabase.auth.signOut();
    redirect("/login?error=not_allowed");
  }
  await ensureDefaults(supabase, user.id);
  return { supabase, user };
});
