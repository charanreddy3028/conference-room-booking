"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"

type Room = Database["public"]["Tables"]["rooms"]["Row"]
type Booking = Database["public"]["Tables"]["bookings"]["Row"]
type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"]

// Demo data fallback
const getDemoRooms = (): Room[] => [
  {
    id: "1",
    name: "Conference Room A",
    floor: "Fourth Floor",
    capacity: 12,
    created_at: new Date().toISOString(),
  },
  { id: "2", name: "Meeting Room B", floor: "Fourth Floor", capacity: 8, created_at: new Date().toISOString() },
  { id: "3", name: "Boardroom", floor: "Fourth Floor", capacity: 16, created_at: new Date().toISOString() },
  {
    id: "4",
    name: "Small Meeting Room",
    floor: "First Floor",
    capacity: 4,
    created_at: new Date().toISOString(),
  },
  { id: "5", name: "Training Room", floor: "First Floor", capacity: 20, created_at: new Date().toISOString() },
  {
    id: "6",
    name: "Reception Meeting Room",
    floor: "Ground Floor",
    capacity: 6,
    created_at: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Lobby Conference Room",
    floor: "Ground Floor",
    capacity: 10,
    created_at: new Date().toISOString(),
  },
]

const getDemoBookings = (): Booking[] => [
  {
    id: "1",
    room_id: "1",
    room_name: "Conference Room A",
    floor: "Fourth Floor",
    booked_by: "John Smith",
    date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "10:30",
    status: "completed",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    room_id: "1",
    room_name: "Conference Room A",
    floor: "Fourth Floor",
    booked_by: "Sarah Johnson",
    date: new Date().toISOString().split("T")[0],
    start_time: "14:00",
    end_time: "15:30",
    status: "in-progress",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    room_id: "2",
    room_name: "Meeting Room B",
    floor: "Fourth Floor",
    booked_by: "Mike Davis",
    date: new Date().toISOString().split("T")[0],
    start_time: "16:00",
    end_time: "17:00",
    status: "upcoming",
    created_at: new Date().toISOString(),
  },
]

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!supabase) {
        // No Supabase configuration, use demo data
        setRooms(getDemoRooms())
        return
      }

      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("floor", { ascending: true })
        .order("name", { ascending: true })

      if (error) {
        // If the tables haven't been created yet, quietly fall back to demo data
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          console.warn(
            "📋 Supabase tables not found. Using demo data. To enable live data:\n" +
              "1. Go to your Supabase project dashboard\n" +
              "2. Navigate to SQL Editor\n" +
              "3. Run the table creation scripts from the code project",
          )
          setRooms(getDemoRooms())
          return
        }
        console.error("Supabase error:", error)
        throw error
      }

      setRooms(data || [])
    } catch (err) {
      console.warn("Failed to fetch rooms from Supabase, using demo data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch rooms")
      setRooms(getDemoRooms())
    } finally {
      setLoading(false)
    }
  }

  return { rooms, loading, error, refetch: fetchRooms }
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()

    // Set up real-time subscription if Supabase is available
    if (supabase) {
      const subscription = supabase
        .channel("bookings_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
          fetchBookings()
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!supabase) {
        // No Supabase configuration, use demo data
        setBookings(getDemoBookings())
        return
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) {
        // If the tables haven't been created yet, quietly fall back to demo data
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          console.warn("📋 Supabase bookings table not found. Using demo data.")
          setBookings(getDemoBookings())
          return
        }
        console.error("Supabase error:", error)
        throw error
      }

      setBookings(data || [])
    } catch (err) {
      console.warn("Failed to fetch bookings from Supabase, using demo data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch bookings")
      setBookings(getDemoBookings())
    } finally {
      setLoading(false)
    }
  }

  /** Ensure the room row exists before inserting a booking.
   *  When users haven’t seeded the DB, we create a minimal row so the
   *  bookings FK constraint isn’t violated. */
  async function ensureRoom(room_id: string, room_name: string, floor: string, capacity = 0) {
    if (!supabase) return // demo-mode
    // Does the room already exist?
    const { data: exists } = await supabase.from("rooms").select("id").eq("id", room_id).maybeSingle()

    if (!exists) {
      // Insert a placeholder row; ON CONFLICT prevents duplicates.
      await supabase.from("rooms").upsert([{ id: room_id, name: room_name, floor, capacity }], { onConflict: "id" })
    }
  }

  const createBooking = async (booking: BookingInsert) => {
    try {
      if (!supabase) {
        // Demo-mode success
        return {
          data: { ...booking, id: Date.now().toString(), created_at: new Date().toISOString() },
          error: null,
        }
      }

      // 1⃣  Guarantee FK integrity
      await ensureRoom(booking.room_id as string, booking.room_name, booking.floor)

      // 2⃣  Insert booking
      const { data, error } = await supabase.from("bookings").insert([booking]).select().single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error("Failed to create booking:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to create booking" }
    }
  }

  const updateBookingStatus = async (id: string, status: "upcoming" | "in-progress" | "completed") => {
    try {
      if (!supabase) {
        // Simulate success in demo mode
        return { error: null }
      }

      const { error } = await supabase.from("bookings").update({ status }).eq("id", id)

      if (error) {
        console.error("Error updating booking status:", error)
        throw error
      }

      return { error: null }
    } catch (err) {
      console.error("Failed to update booking status:", err)
      return { error: err instanceof Error ? err.message : "Failed to update booking status" }
    }
  }

  return {
    bookings,
    loading,
    error,
    createBooking,
    updateBookingStatus,
    refetch: fetchBookings,
  }
}
