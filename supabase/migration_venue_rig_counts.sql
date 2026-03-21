-- Migration: Create a view for venue listing with aggregate rig counts.
-- Replaces client-side rig counting with a single SQL query.

CREATE OR REPLACE VIEW venue_with_counts AS
SELECT
    v.id,
    v.name,
    v.location,
    v.price,
    v.description,
    v.image_url,
    v.owner_id,
    COUNT(r.id)::int AS total_rigs,
    COUNT(r.id) FILTER (WHERE r.status = 'available')::int AS available_rigs
FROM venues v
LEFT JOIN rigs r ON r.venue_id = v.id
GROUP BY v.id;

-- Grant access to the view (anon + authenticated roles)
GRANT SELECT ON venue_with_counts TO anon, authenticated;
