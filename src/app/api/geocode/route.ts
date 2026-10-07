import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { searchPlaces } from "@/lib/geocode";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return NextResponse.json({ places: [] }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ places: [] });
  try {
    return NextResponse.json({ places: await searchPlaces(q, 6) });
  } catch {
    return NextResponse.json({ places: [] });
  }
}
