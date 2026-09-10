import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BUCKET = "site-media";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/websites/media — owner photo upload for their website gallery.
 * Stored in the public `site-media` bucket at {userId}/{websiteId}-{ts}.{ext}
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const { data: auth, error: authErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !auth?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const user = auth.user;

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const websiteId = String(form.get("websiteId") || "");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No photo received." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "That photo is larger than 5MB." }, { status: 400 });
    }

    // The website must belong to this user.
    const { data: site } = await supabaseAdmin
      .from("websites")
      .select("id, user_id")
      .eq("id", websiteId)
      .maybeSingle();
    if (!site || site.user_id !== user.id) {
      return NextResponse.json({ error: "Website not found." }, { status: 404 });
    }

    // Ensure the bucket exists (public read).
    const { error: bucketErr } = await supabaseAdmin.storage.getBucket(BUCKET);
    if (bucketErr) {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: true }).catch(() => {});
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${user.id}/${websiteId}-${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true });
    if (upErr) {
      console.error("❌ Media upload failed:", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ success: true, url: pub?.publicUrl || "" });
  } catch (err: any) {
    console.error("❌ Media route error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
