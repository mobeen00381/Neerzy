import { createClient } from "@supabase/supabase-js";

// We use service role key here to bypass RLS, ensuring webhook can always update state
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export type WhatsAppSession = {
  id: string;
  phone: string;
  accumulated_images: string[];
  transcript: string;
  step: string;
  customer_name?: string;
  customer_phone?: string;
  created_at: string;
  updated_at: string;
};

export async function getSession(phone: string): Promise<WhatsAppSession | null> {
  const { data, error } = await supabase
    .from("whatsapp_sessions")
    .select("*")
    .eq("phone", phone)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // PostgREST error for row not found
    console.error("Error fetching session:", error);
    return null;
  }
  return data;
}

export async function createSession(phone: string): Promise<WhatsAppSession> {
  const { data, error } = await supabase
    .from("whatsapp_sessions")
    .insert([{ phone }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data;
}

export async function updateSession(id: string, updates: Partial<WhatsAppSession>): Promise<void> {
  const { error } = await supabase
    .from("whatsapp_sessions")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error(`Failed to update session: ${error.message}`);
}
