-- Create trails table (static trail data)
CREATE TABLE trails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_number TEXT, -- The "id" from original data like "1", "2", etc
  slug TEXT NOT NULL UNIQUE,
  outdooractive_id BIGINT,
  full_name TEXT NOT NULL,
  name TEXT NOT NULL,
  area TEXT,
  category_code TEXT,
  category TEXT,
  difficulty_technical TEXT,
  difficulty_overall TEXT,
  elevation_highest INTEGER,
  elevation_lowest INTEGER,
  elevation_ascent INTEGER,
  elevation_descent INTEGER,
  distance_km DECIMAL(10, 2),
  duration_minutes INTEGER,
  description_short TEXT,
  gpx_file TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trail_status table (daily status updates)
CREATE TABLE trail_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Open', 'Closed')),
  status_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trail_id, status_date)
);

-- Create indexes for performance
CREATE INDEX idx_trails_slug ON trails(slug);
CREATE INDEX idx_trails_category ON trails(category);
CREATE INDEX idx_trails_area ON trails(area);
CREATE INDEX idx_trail_status_trail_id ON trail_status(trail_id);
CREATE INDEX idx_trail_status_date ON trail_status(status_date);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_trails_updated_at
    BEFORE UPDATE ON trails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view to get trails with their current status
CREATE OR REPLACE VIEW trails_with_status AS
SELECT
  t.*,
  COALESCE(ts.status, 'Open') as current_status,
  ts.status_date,
  ts.notes as status_notes
FROM trails t
LEFT JOIN LATERAL (
  SELECT status, status_date, notes
  FROM trail_status
  WHERE trail_id = t.id
  ORDER BY status_date DESC
  LIMIT 1
) ts ON true;

-- Enable Row Level Security (optional, enable if you want to restrict access)
-- ALTER TABLE trails ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trail_status ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (if RLS is enabled)
-- CREATE POLICY "Allow public read access on trails" ON trails FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access on trail_status" ON trail_status FOR SELECT USING (true);
