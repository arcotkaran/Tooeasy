import { db } from "@/lib/db";

export type Garage = {
  id: string | null;
  name: string;
  lat: number;
  lng: number;
  radius_km: number;
  daily_slots: number;
};

/** Used when the database isn't reachable, so the marketing site never breaks. */
const FALLBACK: Garage = {
  id: null,
  name: "Partner Garage 01",
  lat: 42.2306,
  lng: -87.964,
  radius_km: 10,
  daily_slots: 6,
};

export async function getPrimaryGarage(): Promise<Garage> {
  try {
    const [row] = await db().sql<Garage>`
      SELECT id, name, lat, lng, radius_km, daily_slots
      FROM garages
      WHERE active = TRUE
      ORDER BY created_at
      LIMIT 1
    `;
    return row ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}
