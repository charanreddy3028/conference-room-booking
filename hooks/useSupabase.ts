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
    booking_secret: "john123",
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
    status: "upcoming", // Changed to upcoming so delete button shows
    created_at: new Date().toISOString(),
    booking_secret: "sarah456",
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
    booking_secret: "mike789",
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

      const response = await fetch("/api/rooms")
      const result = await response.json()

      if (!result.ok) {
        throw new Error(result.error || "Failed to fetch rooms")
      }

      setRooms(result.data || [])
    } catch (err) {
      console.warn("Failed to fetch rooms from API, using demo data:", err)
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

      const response = await fetch("/api/bookings")
      const result = await response.json()

      if (!result.ok) {
        throw new Error(result.error || "Failed to fetch bookings")
      }

      setBookings(result.data || [])
    } catch (err) {
      console.warn("Failed to fetch bookings from API, using demo data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch bookings")
      setBookings(getDemoBookings())
    } finally {
      setLoading(false)
    }
  }

  const createBooking = async (booking: BookingInsert & { booking_secret: string }) => {
    try {
      if (!supabase) {
        // Demo-mode success
        const newBooking = {
          ...booking,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
        }
        setBookings((prev) => [...prev, newBooking as Booking])
        return {
          data: newBooking,
          error: null,
        }
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(booking),
      })

      const result = await response.json()

      if (!result.ok) {
        throw new Error(result.error || "Failed to create booking")
      }

      // Refresh bookings after successful creation
      await fetchBookings()

      return { data: result.data, error: null }
    } catch (err) {
      console.error("Failed to create booking:", err)
      return { data: null, error: err instanceof Error ? err.message : "Failed to create booking" }
    }
  }

  const deleteBooking = async (id: string, userSecret: string) => {
    try {
      if (!supabase) {
        // Demo mode - check if secret matches
        const booking = bookings.find((b) => b.id === id)
        if (!booking) {
          throw new Error("Booking not found")
        }

        if (booking.booking_secret !== userSecret && userSecret !== "admin123") {
          throw new Error("Invalid secret key")
        }

        setBookings((prev) => prev.filter((b) => b.id !== id))
        return { error: null }
      }

      const response = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userSecret }),
      })

      const result = await response.json()

      if (!result.ok) {
        throw new Error(result.error || "Failed to delete booking")
      }

      // Refresh bookings after successful deletion
      await fetchBookings()

      return { error: null }
    } catch (err) {
      console.error("Failed to delete booking:", err)
      return { error: err instanceof Error ? err.message : "Failed to delete booking" }
    }
  }

  const updateBookingStatus = async (id: string, status: "upcoming" | "in-progress" | "completed") => {
    try {
      if (!supabase) {
        // Simulate success in demo mode
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
        return { error: null }
      }

      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (!result.ok) {
        throw new Error(result.error || "Failed to update booking")
      }

      // Refresh bookings after successful update
      await fetchBookings()

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
    deleteBooking,
    updateBookingStatus,
    refetch: fetchBookings,
  }
}
