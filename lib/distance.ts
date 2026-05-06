// lib/distance.ts
// R17 Arc 1 — haversine distance in miles.
//
// Pure helper: no React, no I/O. Returns null if any input is null so
// the consumer can render <DistancePill miles={null}> and have it render
// nothing (D15 — defensive null-check on missing mall coords).
//
// All 29 active malls have lat/lng populated (session 103 add-mall.ts
// reverse-geocodes), but the null-passthrough is the right shape for
// future malls + the case where useUserLocation is still resolving.
//
// Precision: 1 decimal (D12). 2.7 MI not 2.69 MI and not 3 MI.
//
// Earth radius: 3958.8 miles (mean radius). Beta product is Kentucky-
// bound; spherical-earth approximation is fine at mall-distance scale.

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance in miles between user and mall coordinates.
 * Returns null if any input is null.
 */
export function milesFromUser(
  user:    { lat: number | null; lng: number | null },
  mallLat: number | null,
  mallLng: number | null,
): number | null {
  if (user.lat == null || user.lng == null) return null;
  if (mallLat   == null || mallLng   == null) return null;

  const dLat = toRadians(mallLat - user.lat);
  const dLng = toRadians(mallLng - user.lng);
  const lat1 = toRadians(user.lat);
  const lat2 = toRadians(mallLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const miles = EARTH_RADIUS_MILES * c;
  return Math.round(miles * 10) / 10;
}
