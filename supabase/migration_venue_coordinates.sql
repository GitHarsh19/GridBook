-- ============================================================
-- Migration: Add latitude/longitude to venues
-- Enables map-based venue discovery on the explore page
-- ============================================================

-- Add coordinate columns
ALTER TABLE venues ADD COLUMN IF NOT EXISTS latitude  double precision;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS longitude double precision;

-- Populate coordinates for existing Bengaluru venues
-- Using precise Google Maps coordinates for actual areas
UPDATE venues SET latitude = 12.9121, longitude = 77.6446 WHERE name = 'Apex Racing Lounge';
UPDATE venues SET latitude = 12.9344, longitude = 77.6260 WHERE name = 'Clutch Gaming Arena';
UPDATE venues SET latitude = 12.9784, longitude = 77.6408 WHERE name = 'Pole Position Hub';
UPDATE venues SET latitude = 12.9698, longitude = 77.7499 WHERE name = 'DRS Zone Lounge';

-- Recreate the venue_with_counts view to include lat/lng
CREATE OR REPLACE VIEW venue_with_counts AS
SELECT
  v.id,
  v.name,
  v.location,
  v.price,
  v.description,
  v.image_url,
  v.owner_id,
  v.latitude,
  v.longitude,
  COUNT(r.id)::int                                        AS total_rigs,
  COUNT(r.id) FILTER (WHERE r.status = 'available')::int  AS available_rigs
FROM venues v
LEFT JOIN rigs r ON r.venue_id = v.id
GROUP BY v.id;
