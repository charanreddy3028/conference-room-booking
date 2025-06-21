-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms (read access for everyone)
CREATE POLICY IF NOT EXISTS "Allow read access to rooms" ON rooms
  FOR SELECT USING (true);

-- Create policies for bookings
CREATE POLICY IF NOT EXISTS "Allow read access to bookings" ON bookings
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow insert access to bookings" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow update access to bookings" ON bookings
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Allow delete access to bookings" ON bookings
  FOR DELETE USING (true);
