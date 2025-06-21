import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./supabase-types"

// Helper that returns a *server-side* Supabase client.
// Throws if the required env-vars are missing.
export function getServerClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL // server-side var (no NEXT_PUBLIC)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY // full-access service key

  if (!url || !key) throw new Error("Supabase env-vars missing")
  return createClient<Database>(url, key, { auth: { persistSession: false } })
}
