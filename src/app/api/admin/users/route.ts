import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.user_metadata?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: points, error } = await supabase
    .from("user_points")
    .select("user_id, balance");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!points) {
    return NextResponse.json([]);
  }

  const enriched = points.map((p: any) => ({
    user_id: p.user_id,
    email: p.user_id.slice(0, 8) + "...",
    balance: p.balance,
  }));

  return NextResponse.json(enriched);
}
