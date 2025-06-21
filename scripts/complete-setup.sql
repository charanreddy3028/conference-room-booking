-- Complete Supabase setup for Conference Room Booking
-- Run this single script in your Supabase SQL Editor

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;

-- Create rooms table
CREATE TABLE public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    floor TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    room_name TEXT NOT NULL,
    floor TEXT NOT NULL,
    booked_by TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in-progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_room_date ON public.bookings(room_id, date);
CREATE INDEX idx_bookings_date_time ON public.bookings(date, start_time);
CREATE INDEX idx_rooms_floor ON public.rooms(floor);

-- Insert sample rooms
INSERT INTO public.rooms (name, floor, capacity) VALUES
    ('Conference Room A', 'Fourth Floor', 12),
    ('Meeting Room B', 'Fourth Floor', 8),
    ('Boardroom', 'Fourth Floor', 16),
    ('Small Meeting Room', 'First Floor', 4),
    ('Training Room', 'First Floor', 20),
    ('Reception Meeting Room', 'Ground Floor', 6),
    ('Lobby Conference Room', 'Ground Floor', 10);

-- Insert sample bookings for today
INSERT INTO public.bookings (room_id, room_name, floor, booked_by, date, start_time, end_time, status)
SELECT 
    r.id,
    r.name,
    r.floor,
    'John Smith',
    CURRENT_DATE,
    '09:00',
    '10:30',
    'completed'
FROM public.rooms r WHERE r.name = 'Conference Room A';

INSERT INTO public.bookings (room_id, room_name, floor, booked_by, date, start_time, end_time, status)
SELECT 
    r.id,
    r.name,
    r.floor,
    'Sarah Johnson',
    CURRENT_DATE,
    '14:00',
    '15:30',
    'in-progress'
FROM public.rooms r WHERE r.name = 'Conference Room A';

INSERT INTO public.bookings (room_id, room_name, floor, booked_by, date, start_time, end_time, status)
SELECT 
    r.id,
    r.name,
    r.floor,
    'Mike Davis',
    CURRENT_DATE,
    '16:00',
    '17:00',
    'upcoming'
FROM public.rooms r WHERE r.name = 'Meeting Room B';

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms (read access for everyone)
CREATE POLICY "Allow read access to rooms" ON public.rooms
    FOR SELECT USING (true);

-- Create policies for bookings
CREATE POLICY "Allow read access to bookings" ON public.bookings
    FOR SELECT USING (true);

CREATE POLICY "Allow insert access to bookings" ON public.bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to bookings" ON public.bookings
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to bookings" ON public.bookings
    FOR DELETE USING (true);

-- Verify the setup
SELECT 'Setup completed successfully!' as status;
SELECT COUNT(*) as room_count FROM public.rooms;
SELECT COUNT(*) as booking_count FROM public.bookings;
