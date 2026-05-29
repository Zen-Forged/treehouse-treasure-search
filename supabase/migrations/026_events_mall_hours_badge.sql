-- 026_events_mall_hours_badge.sql
-- Session 203 — Location hours Shape B Arc 4 (docs/location-hours-design.md D14).
--
-- Adds the 'mall_hours_badge_tapped' value to the event_type enum so the
-- open-now badge's tap analytics (mall_slug, surface, open_state) record
-- instead of silently 400-ing. Per the session-194 lesson: a track() call
-- whose event_type isn't in the enum fails the /api/events insert silently —
-- the enum value must exist for the event to land.
--
-- ALTER TYPE ADD VALUE is additive and (in Postgres) must run outside an
-- explicit transaction block — paste this statement on its own. Idempotent
-- via IF NOT EXISTS, so it's safe to run on prod + staging regardless of
-- prior state.

ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'mall_hours_badge_tapped';
