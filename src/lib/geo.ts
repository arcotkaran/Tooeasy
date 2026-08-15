/**
 * Service area.
 *
 * Australian postcodes cover several suburbs — 2145 alone is Westmead,
 * Wentworthville, Greystanes, Girraween and more — so the dataset is
 * suburb-level and the customer picks their suburb by name.
 *
 * The operating radius is an internal planning number. It is never shown to
 * customers: they see a list of suburbs, not a distance.
 */

/** Parramatta — the centre of the service area. */
export const SERVICE_CENTRE = { lat: -33.815, lng: 151.005 };

/** Internal only. Do not surface this in customer-facing copy. */
const RADIUS_KM = 10;

export type Suburb = {
  name: string;
  postcode: string;
  lat: number;
  lng: number;
};

/**
 * Suburbs in and around the Parramatta region. Coordinates are approximate
 * suburb centres — good enough to decide coverage, and any address near the
 * boundary is confirmed by a human before a driver is dispatched.
 */
export const SUBURBS: Suburb[] = [
  // 2150 / 2151 / 2152 — Parramatta core
  { name: "Parramatta", postcode: "2150", lat: -33.815, lng: 151.005 },
  { name: "Harris Park", postcode: "2150", lat: -33.8232, lng: 151.008 },
  { name: "North Parramatta", postcode: "2151", lat: -33.795, lng: 151.0 },
  { name: "North Rocks", postcode: "2151", lat: -33.77, lng: 151.023 },
  { name: "Northmead", postcode: "2152", lat: -33.783, lng: 150.988 },

  // 2153 — Hills
  { name: "Winston Hills", postcode: "2153", lat: -33.777, lng: 150.976 },
  { name: "Baulkham Hills", postcode: "2153", lat: -33.762, lng: 150.992 },
  { name: "Bella Vista", postcode: "2153", lat: -33.737, lng: 150.944 },

  // 2145 — Westmead / Wentworthville cluster
  { name: "Westmead", postcode: "2145", lat: -33.805, lng: 150.988 },
  { name: "Wentworthville", postcode: "2145", lat: -33.8069, lng: 150.9736 },
  { name: "South Wentworthville", postcode: "2145", lat: -33.818, lng: 150.965 },
  { name: "Constitution Hill", postcode: "2145", lat: -33.794, lng: 150.964 },
  { name: "Girraween", postcode: "2145", lat: -33.796, lng: 150.949 },
  { name: "Greystanes", postcode: "2145", lat: -33.818, lng: 150.945 },
  { name: "Mays Hill", postcode: "2145", lat: -33.815, lng: 150.986 },
  { name: "Pendle Hill", postcode: "2145", lat: -33.8, lng: 150.956 },
  { name: "Pemulwuy", postcode: "2145", lat: -33.83, lng: 150.91 },

  // 2146 / 2147 — Toongabbie, Seven Hills
  { name: "Toongabbie", postcode: "2146", lat: -33.787, lng: 150.945 },
  { name: "Old Toongabbie", postcode: "2146", lat: -33.793, lng: 150.956 },
  { name: "Seven Hills", postcode: "2147", lat: -33.774, lng: 150.935 },
  { name: "Lalor Park", postcode: "2147", lat: -33.766, lng: 150.927 },
  { name: "Kings Langley", postcode: "2147", lat: -33.753, lng: 150.933 },

  // 2148 — Prospect
  { name: "Prospect", postcode: "2148", lat: -33.8, lng: 150.913 },

  // 2160 / 2161 — Merrylands, Guildford
  { name: "Merrylands", postcode: "2160", lat: -33.836, lng: 150.99 },
  { name: "Merrylands West", postcode: "2160", lat: -33.836, lng: 150.972 },
  { name: "Holroyd", postcode: "2160", lat: -33.833, lng: 150.98 },
  { name: "Guildford", postcode: "2161", lat: -33.854, lng: 150.988 },
  { name: "Guildford West", postcode: "2161", lat: -33.856, lng: 150.97 },
  { name: "Old Guildford", postcode: "2161", lat: -33.865, lng: 150.98 },
  { name: "Yennora", postcode: "2161", lat: -33.862, lng: 150.96 },

  // 2142 / 2144 — Granville, Auburn
  { name: "Granville", postcode: "2142", lat: -33.833, lng: 151.01 },
  { name: "South Granville", postcode: "2142", lat: -33.848, lng: 151.0 },
  { name: "Clyde", postcode: "2142", lat: -33.838, lng: 151.025 },
  { name: "Rosehill", postcode: "2142", lat: -33.825, lng: 151.025 },
  { name: "Camellia", postcode: "2142", lat: -33.818, lng: 151.027 },
  { name: "Auburn", postcode: "2144", lat: -33.849, lng: 151.033 },

  // 2141 / 2143 — Lidcombe, Regents Park
  { name: "Lidcombe", postcode: "2141", lat: -33.864, lng: 151.043 },
  { name: "Berala", postcode: "2141", lat: -33.87, lng: 151.03 },
  { name: "Regents Park", postcode: "2143", lat: -33.883, lng: 151.023 },
  { name: "Potts Hill", postcode: "2143", lat: -33.888, lng: 151.023 },
  { name: "Birrong", postcode: "2143", lat: -33.893, lng: 151.033 },

  // 2116 / 2117 / 2118 / 2115 — north of the river
  { name: "Rydalmere", postcode: "2116", lat: -33.813, lng: 151.033 },
  { name: "Dundas", postcode: "2117", lat: -33.801, lng: 151.033 },
  { name: "Dundas Valley", postcode: "2117", lat: -33.789, lng: 151.045 },
  { name: "Telopea", postcode: "2117", lat: -33.793, lng: 151.04 },
  { name: "Carlingford", postcode: "2118", lat: -33.779, lng: 151.049 },
  { name: "Ermington", postcode: "2115", lat: -33.814, lng: 151.053 },

  // 2114 / 2122 — Ryde side
  { name: "West Ryde", postcode: "2114", lat: -33.807, lng: 151.088 },
  { name: "Meadowbank", postcode: "2114", lat: -33.818, lng: 151.09 },
  { name: "Denistone", postcode: "2114", lat: -33.799, lng: 151.08 },
  { name: "Eastwood", postcode: "2122", lat: -33.79, lng: 151.082 },

  // 2164 / 2165 — Smithfield, Fairfield
  { name: "Smithfield", postcode: "2164", lat: -33.848, lng: 150.94 },
  { name: "Wetherill Park", postcode: "2164", lat: -33.856, lng: 150.906 },
  { name: "Fairfield", postcode: "2165", lat: -33.871, lng: 150.956 },
  { name: "Fairfield East", postcode: "2165", lat: -33.868, lng: 150.97 },
  { name: "Fairfield Heights", postcode: "2165", lat: -33.865, lng: 150.94 },
  { name: "Fairfield West", postcode: "2165", lat: -33.87, lng: 150.93 },

  // 2154 / 2119 — Hills / Beecroft
  { name: "Castle Hill", postcode: "2154", lat: -33.732, lng: 151.005 },
  { name: "Beecroft", postcode: "2119", lat: -33.75, lng: 151.064 },

  // ── Outside the area today. Kept so the waitlist can name the suburb
  //    instead of saying "we don't recognise that postcode".
  { name: "Blacktown", postcode: "2148", lat: -33.769, lng: 150.908 },
  { name: "Marayong", postcode: "2148", lat: -33.744, lng: 150.895 },
  { name: "Kings Park", postcode: "2148", lat: -33.746, lng: 150.908 },
  { name: "Doonside", postcode: "2767", lat: -33.762, lng: 150.87 },
  { name: "Woodcroft", postcode: "2767", lat: -33.753, lng: 150.876 },
  { name: "Quakers Hill", postcode: "2763", lat: -33.734, lng: 150.879 },
  { name: "Mount Druitt", postcode: "2770", lat: -33.769, lng: 150.819 },
  { name: "Penrith", postcode: "2750", lat: -33.751, lng: 150.694 },
  { name: "Kellyville", postcode: "2155", lat: -33.713, lng: 150.956 },
  { name: "Cherrybrook", postcode: "2126", lat: -33.722, lng: 151.045 },
  { name: "Marsfield", postcode: "2122", lat: -33.78, lng: 151.105 },
  { name: "Cabramatta", postcode: "2166", lat: -33.895, lng: 150.935 },
  { name: "Canley Vale", postcode: "2166", lat: -33.888, lng: 150.942 },
  { name: "Canley Heights", postcode: "2166", lat: -33.888, lng: 150.928 },
  { name: "Prairiewood", postcode: "2164", lat: -33.865, lng: 150.908 },
  { name: "Liverpool", postcode: "2170", lat: -33.92, lng: 150.923 },
  { name: "Bankstown", postcode: "2200", lat: -33.918, lng: 151.035 },
  { name: "Strathfield", postcode: "2135", lat: -33.879, lng: 151.093 },
  { name: "Sydney CBD", postcode: "2000", lat: -33.8688, lng: 151.2093 },
  { name: "North Sydney", postcode: "2060", lat: -33.838, lng: 151.206 },
];

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

export function isCovered(s: Suburb): boolean {
  return haversineKm(s, SERVICE_CENTRE) <= RADIUS_KM;
}

/** Serviced suburbs, alphabetical — this is the published list. */
export function coveredSuburbs(): Suburb[] {
  return SUBURBS.filter(isCovered).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Type-ahead over both suburb name and postcode, so "21" surfaces every 21xx
 * suburb and "went" surfaces Wentworthville. Serviced suburbs rank first.
 */
export function searchSuburbs(query: string, limit = 40): Suburb[] {
  const q = query.trim().toLowerCase();
  if (!q) return coveredSuburbs().slice(0, limit);

  const scored = SUBURBS.map((s) => {
    const name = s.name.toLowerCase();
    let score = -1;
    if (name.startsWith(q)) score = 0;
    else if (s.postcode.startsWith(q)) score = 1;
    else if (name.includes(q)) score = 2;
    return { s, score };
  }).filter((x) => x.score >= 0);

  return scored
    .sort(
      (a, b) =>
        Number(isCovered(b.s)) - Number(isCovered(a.s)) ||
        a.score - b.score ||
        a.s.name.localeCompare(b.s.name),
    )
    .slice(0, limit)
    .map((x) => x.s);
}

export function findSuburb(name: string, postcode: string): Suburb | undefined {
  return SUBURBS.find(
    (s) =>
      s.postcode === postcode.trim() &&
      s.name.toLowerCase() === name.trim().toLowerCase(),
  );
}

export type Coverage =
  | { covered: true; suburb: string; postcode: string }
  | { covered: false; suburb: string | null; postcode: string; reason: "too_far" | "unknown" };

/** Coverage for a named suburb, falling back to postcode-only lookups. */
export function checkCoverage(name: string, postcode: string): Coverage {
  const pc = (postcode || "").trim().slice(0, 4);
  const exact = name ? findSuburb(name, pc) : undefined;

  if (exact) {
    return isCovered(exact)
      ? { covered: true, suburb: exact.name, postcode: pc }
      : { covered: false, suburb: exact.name, postcode: pc, reason: "too_far" };
  }

  // Postcode only: covered if any suburb sharing it is inside the area.
  const inPostcode = SUBURBS.filter((s) => s.postcode === pc);
  if (inPostcode.length === 0) {
    return { covered: false, suburb: null, postcode: pc, reason: "unknown" };
  }
  const hit = inPostcode.find(isCovered);
  return hit
    ? { covered: true, suburb: hit.name, postcode: pc }
    : { covered: false, suburb: inPostcode[0].name, postcode: pc, reason: "too_far" };
}
