import { type NextRequest, NextResponse } from "next/server"
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

export async function POST(request: NextRequest) {
  try {
    const booking = await request.json()
    const supabase = getServerClient()

    // Ensure the room row exists before inserting a booking
    const { data: roomExists } = await supabase.from("rooms").select("id").eq("id", booking.room_id).maybeSingle()

    if (!roomExists) {
      // Insert a placeholder room if it doesn't exist
      await supabase.from("rooms").upsert(
        [
          {
            id: booking.room_id,
            name: booking.room_name,
            floor: booking.floor,
            capacity: 10, // default capacity
          },
        ],
        { onConflict: "id" },
      )
    }

    // Check for conflicts
    const { data: conflicts } = await supabase
      .from("bookings")
      .select("*")
      .eq("room_id", booking.room_id)
      .eq("date", booking.date)

    if (conflicts) {
      const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number)
        return hours * 60 + minutes
      }

      const newStartMinutes = timeToMinutes(booking.start_time)
      const newEndMinutes = timeToMinutes(booking.end_time)

      const conflictingBooking = conflicts.find((existingBooking) => {
        const bookingStart = timeToMinutes(existingBooking.start_time)
        const bookingEnd = timeToMinutes(existingBooking.end_time)
        return newStartMinutes < bookingEnd && newEndMinutes > bookingStart
      })

      if (conflictingBooking) {
        return NextResponse.json(
          {
            ok: false,
            error: "conflict",
            conflict: {
              message: `Room already booked by ${conflictingBooking.booked_by} from ${conflictingBooking.start_time} to ${conflictingBooking.end_time}`,
              booking: conflictingBooking,
            },
          },
          { status: 409 },
        )
      }
    }

    // Insert the booking
    const { data, error } = await supabase.from("bookings").insert([booking]).select().single()

    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    console.error("Create booking API error:", err)
    return NextResponse.json({ ok: false, error: err.message || "Failed to create booking" }, { status: 500 })
  }
}
