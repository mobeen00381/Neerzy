import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'mobeen0381@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mobeenadmin';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'fallback-secret-neerzy-2026-xyz';

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing Supabase Config' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action } = body;

    // --- Authentication: Login Action ---
    if (action === 'login') {
      const { email, password } = body;
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
        return NextResponse.json({ success: true, token });
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // --- Authentication: Verify Token for protected actions ---
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'loadData') {
      const { data: dLinks } = await supabase.from("demo_links").select("*").order("created_at", { ascending: false });
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: webPosts } = await supabase.from("posts").select("id, user_id, status, content, image_url, created_at").order("created_at", { ascending: false });
      const { data: waPosts } = await supabase.from("pending_posts").select("id, user_phone, status, google_post, voice_note, images, created_at").order("created_at", { ascending: false });
      
      return NextResponse.json({ 
        dLinks: dLinks || [], 
        profiles: profiles || [], 
        webPosts: webPosts || [], 
        waPosts: waPosts || [] 
      });
    }

    if (action === 'loadHistory') {
      const { userId, userPhone } = body;
      let webPosts = [], waPosts = [];
      if (userId) {
        const { data } = await supabase.from("posts").select("*").eq("user_id", userId);
        if (data) webPosts = data;
      }
      if (userPhone && userPhone !== "No phone") {
        const { data } = await supabase.from("pending_posts").select("*").eq("user_phone", userPhone);
        if (data) waPosts = data;
      }
      return NextResponse.json({ webPosts, waPosts });
    }

    if (action === 'generateDemoLink') {
      const code = `early_access_${Math.random().toString(36).substring(2, 8)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase.from("demo_links").insert([{ code, expires_at: expiresAt, used: false }]).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (action === 'deleteDemoLink') {
      const { id } = body;
      const { error } = await supabase.from("demo_links").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
