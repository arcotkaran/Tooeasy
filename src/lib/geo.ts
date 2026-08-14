/**
 * Service-area check.
 *
 * We promise pickup within a fixed road-radius of the partner garage. The
 * radius lives on the garage row so it can be widened without a deploy; this
 * module only answers "is this ZIP inside it?".
 *
 * ZIP centroids are approximate — good enough to gate a booking, and any
 * near-boundary address gets confirmed by a human before dispatch anyway.
 */

export const ZIP_CENTROIDS: Record<string, { lat: number; lng: number; name: string }> = {
  "60061": { lat: 42.2306, lng: -87.964, name: "Vernon Hills" },
  "60048": { lat: 42.2867, lng: -87.96, name: "Libertyville" },
  "60060": { lat: 42.2704, lng: -88.01, name: "Mundelein" },
  "60069": { lat: 42.19, lng: -87.9089, name: "Lincolnshire" },
  "60089": { lat: 42.1662, lng: -87.9631, name: "Buffalo Grove" },
  "60047": { lat: 42.1953, lng: -88.07, name: "Hawthorn Woods" },
  "60045": { lat: 42.2411, lng: -87.8558, name: "Lake Forest" },
  "60044": { lat: 42.2792, lng: -87.8342, name: "Lake Bluff" },
  "60015": { lat: 42.1656, lng: -87.8442, name: "Deerfield" },
  "60090": { lat: 42.1348, lng: -87.9285, name: "Wheeling" },
  "60031": { lat: 42.3703, lng: -87.9497, name: "Gurnee" },
  "60030": { lat: 42.3444, lng: -88.0356, name: "Grayslake" },
  "60084": { lat: 42.265, lng: -88.14, name: "Wauconda" },
  "60035": { lat: 42.1817, lng: -87.8103, name: "Highland Park" },
  "60040": { lat: 42.2, lng: -87.81, name: "Highwood" },
  "60062": { lat: 42.13, lng: -87.84, name: "Northbrook" },
  "60070": { lat: 42.105, lng: -87.925, name: "Prospect Heights" },
  "60004": { lat: 42.115, lng: -87.98, name: "Arlington Heights" },
  "60005": { lat: 42.065, lng: -87.985, name: "Arlington Heights" },
  "60074": { lat: 42.14, lng: -88.03, name: "Palatine" },
  "60067": { lat: 42.12, lng: -88.07, name: "Palatine" },
  "60010": { lat: 42.15, lng: -88.14, name: "Barrington" },
  "60073": { lat: 42.35, lng: -88.09, name: "Round Lake" },
  "60046": { lat: 42.41, lng: -88.07, name: "Lake Villa" },
  "60085": { lat: 42.36, lng: -87.845, name: "Waukegan" },
  "60087": { lat: 42.42, lng: -87.86, name: "Beach Park" },
  "60064": { lat: 42.32, lng: -87.85, name: "North Chicago" },
  "60083": { lat: 42.43, lng: -87.93, name: "Wadsworth" },
  "60099": { lat: 42.45, lng: -87.85, name: "Zion" },
  "60002": { lat: 42.47, lng: -88.07, name: "Antioch" },
  "60020": { lat: 42.4, lng: -88.19, name: "Fox Lake" },
  "60041": { lat: 42.38, lng: -88.15, name: "Ingleside" },
  "60013": { lat: 42.22, lng: -88.24, name: "Cary" },
  "60014": { lat: 42.23, lng: -88.32, name: "Crystal Lake" },
  "60050": { lat: 42.34, lng: -88.27, name: "McHenry" },
};

/**
 * The launch garage's coordinates and pickup radius. Lives here until there's
 * a database to hold multiple partner shops.
 */
export const GARAGE = {
  lat: 42.2306,
  lng: -87.964,
  radius_km: 10,
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
  | { covered: true; zip: string; area: string; distanceKm: number }
  | { covered: false; zip: string; area: string | null; distanceKm: number | null; reason: "too_far" | "unknown_zip" };

export function checkCoverage(
  rawZip: string,
  garage: { lat: number; lng: number; radius_km: number },
): Coverage {
  const zip = (rawZip || "").trim().slice(0, 5);
  const point = ZIP_CENTROIDS[zip];

  if (!point) {
    return { covered: false, zip, area: null, distanceKm: null, reason: "unknown_zip" };
  }

  const distanceKm = haversineKm(point, garage);
  if (distanceKm <= garage.radius_km) {
    return { covered: true, zip, area: point.name, distanceKm };
  }
  return { covered: false, zip, area: point.name, distanceKm, reason: "too_far" };
}

export const kmToMiles = (km: number) => km * 0.621371;
