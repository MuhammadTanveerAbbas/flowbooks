import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const cronSecret = process.env.CRON_SECRET!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (error) {
    console.error("[keep-alive] Query error:", error.message);
    return new NextResponse("Database error", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}