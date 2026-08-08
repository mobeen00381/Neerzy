import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Missing Supabase environment variables. Database operations will fail.");
}

function createSupabaseStub(): SupabaseClient {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null as any }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOtp: () => Promise.resolve({ data: null, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
      verifyOtp: () => Promise.resolve({ data: null, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      updateUser: () => Promise.resolve({ data: null, error: null }),
      admin: { listUsers: () => Promise.resolve({ data: null, error: null }) },
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }), order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }), order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      upsert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
    removeChannel: () => Promise.resolve('ok'),
    removeAllChannels: () => Promise.resolve([]),
    getChannels: () => [],
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        list: () => Promise.resolve({ data: [], error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        createSignedUrl: () => Promise.resolve({ data: { signedUrl: '' }, error: null }),
      }),
    },
    functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
    realtime: {} as any,
  } as unknown as SupabaseClient;
}

let _client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    try {
      _client = createClient(supabaseUrl, supabaseAnonKey);
    } catch {
      console.warn("⚠️ Supabase client creation failed — using stub (SSR safe).");
      _client = createSupabaseStub();
    }
  }
  return _client;
}

/**
 * Lazy-initialized Supabase client — safe for static prerendering.
 * Returns a stub if client creation fails (e.g., during static generation).
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  },
  has(_, prop) {
    return prop in getSupabaseClient();
  },
  ownKeys() {
    return Reflect.ownKeys(getSupabaseClient());
  },
  getOwnPropertyDescriptor(_, prop) {
    return Reflect.getOwnPropertyDescriptor(getSupabaseClient(), prop);
  },
});
