-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  floor VARCHAR(100) NOT NULL,
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  room_name VARCHAR(255) NOT NULL,
  floor VARCHAR(100) NOT NULL,
  booked_by VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in-progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample rooms
INSERT INTO rooms (name, floor, capacity) VALUES
  ('Conference Room A', 'Fourth Floor', 12),
  ('Meeting Room B', 'Fourth Floor', 8),
  ('Boardroom', 'Fourth Floor', 16),
  ('Small Meeting Room', 'First Floor', 4),
  ('Training Room', 'First Floor', 20),
  ('Reception Meeting Room', 'Ground Floor', 6),
  ('Lobby Conference Room', 'Ground Floor', 10)
ON CONFLICT DO NOTHING;

-- Insert sample bookings
INSERT INTO bookings (room_id, room_name, floor, booked_by, date, start_time, end_time, status) 
SELECT 
  r.id,
  r.name,
  r.floor,
  'John Smith',
  CURRENT_DATE,
  '09:00',
  '10:30',
  'completed'
FROM rooms r WHERE r.name = 'Conference Room A'
ON CONFLICT DO NOTHING;

INSERT INTO bookings (room_id, room_name, floor, booked_by, date, start_time, end_time, status) 
SELECT 
  r.id,
  r.name,
  r.floor,
  'Sarah Johnson',
  CURRENT_DATE,
  '14:00',
  '15:30',
  'in-progress'
FROM rooms r WHERE r.name = 'Conference Room A'
ON CONFLICT DO NOTHING;

INSERT INTO bookings (room_id, room_name, floor, booked_by, date, start_time, end_time, status) 
SELECT 
  r.id,
  r.name,
  r.floor,
  'Mike Davis',
  CURRENT_DATE,
  '16:00',
  '17:00',
  'upcoming'
FROM rooms r WHERE r.name = 'Meeting Room B'
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms (read-only for now)
CREATE POLICY "Allow read access to rooms" ON rooms
  FOR SELECT USING (true);

-- Create policies for bookings
CREATE POLICY "Allow read access to bookings" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to bookings" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to bookings" ON bookings
  FOR UPDATE USING (true);
