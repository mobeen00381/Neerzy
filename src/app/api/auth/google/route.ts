import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-auth";

export async function GET(req: Request) {
  try {
    const urlObj = new URL(req.url);
    const userId = urlObj.searchParams.get("userId") || undefined;
    const url = getGoogleAuthUrl(userId);
    return NextResponse.redirect(url);
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
