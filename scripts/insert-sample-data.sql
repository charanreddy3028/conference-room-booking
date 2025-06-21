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

-- Insert sample bookings for today
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
