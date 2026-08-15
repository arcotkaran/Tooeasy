/**
 * Service-area check.
 *
 * We promise pickup within a fixed radius of the partner workshop. Postcode
 * centroids are approximate — good enough to gate a booking, and any
 * near-boundary address gets confirmed by a human before dispatch anyway.
 */

/** Wentworthville NSW — the launch workshop and the centre of the radius. */
export const WORKSHOP = {
  lat: -33.8069,
  lng: 150.9736,
  radius_km: 10,
};

export const POSTCODE_CENTROIDS: Record<
  string,
  { lat: number; lng: number; name: string }
> = {
  "2145": { lat: -33.8069, lng: 150.9736, name: "Wentworthville" },
  "2150": { lat: -33.815, lng: 151.005, name: "Parramatta" },
  "2151": { lat: -33.795, lng: 151.0, name: "North Parramatta" },
  "2152": { lat: -33.783, lng: 150.988, name: "Northmead" },
  "2153": { lat: -33.762, lng: 150.992, name: "Winston Hills" },
  "2146": { lat: -33.787, lng: 150.945, name: "Toongabbie" },
  "2147": { lat: -33.774, lng: 150.935, name: "Seven Hills" },
  "2148": { lat: -33.769, lng: 150.908, name: "Blacktown" },
  "2160": { lat: -33.836, lng: 150.99, name: "Merrylands" },
  "2161": { lat: -33.854, lng: 150.988, name: "Guildford" },
  "2142": { lat: -33.833, lng: 151.01, name: "Granville" },
  "2144": { lat: -33.849, lng: 151.033, name: "Auburn" },
  "2116": { lat: -33.813, lng: 151.033, name: "Rydalmere" },
  "2117": { lat: -33.801, lng: 151.033, name: "Dundas" },
  "2115": { lat: -33.814, lng: 151.053, name: "Ermington" },
  "2118": { lat: -33.779, lng: 151.049, name: "Carlingford" },
  "2141": { lat: -33.864, lng: 151.043, name: "Lidcombe" },
  "2164": { lat: -33.856, lng: 150.906, name: "Wetherill Park" },
  "2165": { lat: -33.871, lng: 150.956, name: "Fairfield" },
  "2154": { lat: -33.732, lng: 151.005, name: "Castle Hill" },
  "2143": { lat: -33.883, lng: 151.023, name: "Regents Park" },

  // Outside the radius today — recognised so we can name the suburb on the
  // waitlist instead of saying "unknown postcode".
  "2166": { lat: -33.895, lng: 150.935, name: "Cabramatta" },
  "2122": { lat: -33.79, lng: 151.082, name: "Eastwood" },
  "2114": { lat: -33.807, lng: 151.088, name: "West Ryde" },
  "2119": { lat: -33.75, lng: 151.064, name: "Beecroft" },
  "2126": { lat: -33.722, lng: 151.045, name: "Cherrybrook" },
  "2767": { lat: -33.762, lng: 150.87, name: "Doonside" },
  "2763": { lat: -33.734, lng: 150.879, name: "Quakers Hill" },
  "2135": { lat: -33.879, lng: 151.093, name: "Strathfield" },
  "2200": { lat: -33.918, lng: 151.035, name: "Bankstown" },
  "2170": { lat: -33.92, lng: 150.923, name: "Liverpool" },
  "2770": { lat: -33.769, lng: 150.819, name: "Mount Druitt" },
  "2750": { lat: -33.751, lng: 150.694, name: "Penrith" },
  "2000": { lat: -33.8688, lng: 151.2093, name: "Sydney CBD" },
  "2060": { lat: -33.838, lng: 151.206, name: "North Sydney" },
  "2010": { lat: -33.879, lng: 151.215, name: "Surry Hills" },
};

const EARTH_KM = 6371;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(s));
}

export type Coverage =
  | { covered: true; postcode: string; suburb: string; distanceKm: number }
  | {
      covered: false;
      postcode: string;
      suburb: string | null;
      distanceKm: number | null;
      reason: "too_far" | "unknown_postcode";
    };

export function checkCoverage(
  raw: string,
  workshop: { lat: number; lng: number; radius_km: number },
): Coverage {
  const postcode = (raw || "").trim().slice(0, 4);
  const point = POSTCODE_CENTROIDS[postcode];

  if (!point) {
    return {
      covered: false,
      postcode,
      suburb: null,
      distanceKm: null,
      reason: "unknown_postcode",
    };
  }

  const distanceKm = haversineKm(point, workshop);
  if (distanceKm <= workshop.radius_km) {
    return { covered: true, postcode, suburb: point.name, distanceKm };
  }
  return {
    covered: false,
    postcode,
    suburb: point.name,
    distanceKm,
    reason: "too_far",
  };
}
