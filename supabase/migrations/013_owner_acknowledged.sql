-- 013_owner_acknowledged.sql
-- Session 75 — vendor-request redesign (D7).
--
-- Adds an audit-trail boolean for the new "I am the assigned owner of this
-- booth" checkbox shipped on /vendor-request. The form gates submission on
-- the checkbox; the server requires the body field to be true; this column
-- captures the acknowledgement on the row so admins can see it later when
-- reviewing the request.
--
-- Backfill: existing rows get FALSE (the historical /vendor-request flow
-- did not collect this acknowledgement). Filtering on the column won't
-- exclude old approved requests because admins act on rows manually, not
-- by acknowledgement state.

ALTER TABLE vendor_requests
  ADD COLUMN owner_acknowledged BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN vendor_requests.owner_acknowledged IS
  'TRUE when the requester checked the "I am the assigned owner" gate on /vendor-request. Captured for admin audit. Required by the API on new submissions; pre-existing rows backfilled to FALSE.';
