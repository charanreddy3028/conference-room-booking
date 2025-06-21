import { type NextRequest, NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase-server"

export const revalidate = 0 // always fresh

// DELETE booking
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userSecret } = await request.json()
    const supabase = getServerClient()

    // First, get the booking to check the secret
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("booking_secret, booked_by")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 })
    }

    // Check if user secret matches booking secret or is admin
    if (booking.booking_secret !== userSecret && userSecret !== "admin123") {
      return NextResponse.json({ ok: false, error: "Invalid secret key" }, { status: 403 })
    }

    // Delete the booking
    const { error: deleteError } = await supabase.from("bookings").delete().eq("id", params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ ok: true, message: "Booking deleted successfully" })
  } catch (err: any) {
    console.error("Delete booking API error:", err)
    return NextResponse.json({ ok: false, error: err.message || "Failed to delete booking" }, { status: 500 })
  }
}

// PATCH booking (update status)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()
    const supabase = getServerClient()

    const { data, error } = await supabase.from("bookings").update({ status }).eq("id", params.id).select().single()

    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    console.error("Update booking API error:", err)
    return NextResponse.json({ ok: false, error: err.message || "Failed to update booking" }, { status: 500 })
  }
}
