-- Migration: trail status history aggregates
-- Run in the Supabase SQL editor.

-- Speed up per-trail history queries (scraper inserts ~250 rows/hour).
create index if not exists trail_status_trail_id_created_at_idx
  on trail_status (trail_id, created_at desc);

-- Daily per-trail aggregate of the hourly scraper snapshots. The frontend
-- fetches this (≤ ~200 rows per trail) to compute open-streaks and the
-- monthly open-percentage chart.
create or replace view trail_status_daily as
select
  trail_id,
  (created_at at time zone 'utc')::date as day,
  count(*)::int as samples,
  (count(*) filter (where status = 'Open'))::int as open_samples,
  (count(*) filter (where status = 'Limited'))::int as limited_samples,
  (count(*) filter (where status = 'Closed'))::int as closed_samples
from trail_status
group by 1, 2;

grant select on trail_status_daily to anon, authenticated;
