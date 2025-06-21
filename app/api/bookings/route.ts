import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase-server"

export const revalidate = 0 // always fresh

export async function GET() {
  try {
    const supabase = getServerClient()

    const { data, error } = await supabase.from("bookings").select("*").order("date").order("start_time")

    // If the SDK returned an error object, treat as failure
    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    // Log only a concise message (avoid dumping huge HTML)
    console.error("Bookings API - Supabase unreachable:", err?.message || err)

    // Always respond with valid JSON
    return NextResponse.json({ ok: false, error: "supabase-unreachable" }, { status: 503 })
  }
}
