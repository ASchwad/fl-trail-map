-- Migration: multi-region support (finale / freiburg / schliersee)
-- Run in the Supabase SQL editor (or psql with the service role).

-- 1. Region column: existing Finale trails keep working via the default.
alter table trails add column if not exists region text not null default 'finale';
create index if not exists trails_region_idx on trails (region);

-- 2. Marker coordinates for trails without GPX geometry (GSV/Schliersee).
alter table trails add column if not exists marker_lat double precision;
alter table trails add column if not exists marker_lng double precision;

-- 3. Allow the 'Limited' status (mountainbike-freiburg.com "eingeschränkt offen").
alter table trail_status drop constraint if exists trail_status_status_check;
alter table trail_status
  add constraint trail_status_status_check
  check (status in ('Open', 'Limited', 'Closed'));

-- 4. Recreate the view so it picks up the new trail columns.
--    Trails with no status rows yet (freshly imported) surface as 'Unknown'.
drop view if exists trails_with_status;
create view trails_with_status as
select
  t.*,
  coalesce(s.status, 'Unknown') as current_status,
  s.status_date,
  s.notes as status_notes,
  s.created_at as status_created_at
from trails t
left join lateral (
  select ts.status, ts.status_date, ts.notes, ts.created_at
  from trail_status ts
  where ts.trail_id = t.id
  order by ts.created_at desc
  limit 1
) s on true;

-- Recreating the view drops its grants; restore read access for the frontend.
grant select on trails_with_status to anon, authenticated;
