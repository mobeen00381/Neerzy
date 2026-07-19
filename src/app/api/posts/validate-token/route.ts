import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    // Look up the token in the users table
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("quickpost_token", token)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (err: any) {
    console.error("Token validation error:", err);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
