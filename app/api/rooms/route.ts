import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase-server"

export const revalidate = 0 // always fresh

export async function GET() {
  try {
    // ----- 1. ENV-VAR VALIDATION ------------------------------------------------
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("supabase-env-missing")
    }

    // ----- 2. SUPABASE QUERY ----------------------------------------------------
    const supabase = getServerClient()
    const { data, error } = await supabase.from("rooms").select("*").order("floor").order("name")

    if (error) throw error
    // Normal success
    return NextResponse.json({ ok: true, data }, { status: 200 })
  } catch (err: unknown) {
    // ----- 3. UNIFORM ERROR SHAPE ----------------------------------------------
    console.error("Rooms API error:", err)
    /*
      Possible values:
        • { message: "...", ... } (SupabaseError)
        • SyntaxError (Supabase got non-JSON – often wrong URL / key)
        • custom Error("supabase-env-missing")
    */
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "supabase-unknown-error",
      },
      { status: 503 },
    )
  }
}
