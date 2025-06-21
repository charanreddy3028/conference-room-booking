import { createClient } from "@supabase/supabase-js"

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: {
          booked_by: string
          booking_secret: string
          created_at: string
          date: string
          end_time: string
          floor: string
          id: string
          room_id: string | null
          room_name: string
          start_time: string
          status: string | null
        }
        Insert: {
          booked_by: string
          booking_secret: string
          created_at?: string
          date: string
          end_time: string
          floor: string
          id?: string
          room_id?: string | null
          room_name: string
          start_time: string
          status?: string | null
        }
        Update: {
          booked_by?: string
          booking_secret?: string
          created_at?: string
          date?: string
          end_time?: string
          floor?: string
          id?: string
          room_id?: string | null
          room_name?: string
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          floor: string
          id: string
          name: string
        }
        Insert: {
          capacity: number
          created_at?: string
          floor: string
          id?: string
          name: string
        }
        Update: {
          capacity?: number
          created_at?: string
          floor?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Client-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey ? createClient<Database>(supabaseUrl, supabaseAnonKey) : null

export const isSupabaseReady = !!supabase
