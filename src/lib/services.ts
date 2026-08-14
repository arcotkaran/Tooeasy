export type ServiceDef = {
  id: string;
  label: string;
  blurb: string;
  /** Routine work we can usually pick up and return the same day. */
  sameDay: boolean;
};

export const SERVICES: ServiceDef[] = [
  {
    id: "oil",
    label: "Oil & filter change",
    blurb: "Full synthetic or conventional",
    sameDay: true,
  },
  {
    id: "maintenance",
    label: "Scheduled maintenance",
    blurb: "30k / 60k / 90k service",
    sameDay: true,
  },
  {
    id: "tires",
    label: "Tires & rotation",
    blurb: "Rotation, balance, patch, replace",
    sameDay: true,
  },
  {
    id: "brakes",
    label: "Brakes",
    blurb: "Pads, rotors, squealing, soft pedal",
    sameDay: true,
  },
  {
    id: "battery",
    label: "Battery & electrical",
    blurb: "Slow starts, dead battery, alternator",
    sameDay: true,
  },
  {
    id: "inspection",
    label: "Emissions & inspection",
    blurb: "State testing and re-tests",
    sameDay: true,
  },
  {
    id: "diagnostics",
    label: "Check engine / diagnostics",
    blurb: "Warning light, noise, something feels off",
    sameDay: false,
  },
  {
    id: "ac",
    label: "A/C & heating",
    blurb: "Not cold, not hot, strange smell",
    sameDay: false,
  },
  {
    id: "suspension",
    label: "Suspension & steering",
    blurb: "Pulling, vibration, rough ride",
    sameDay: false,
  },
  {
    id: "other",
    label: "Not sure — take a look",
    blurb: "Describe it and the shop will diagnose",
    sameDay: false,
  },
];

export const SERVICE_BY_ID = new Map(SERVICES.map((s) => [s.id, s]));

export function serviceLabels(ids: string[]): string[] {
  return ids.map((id) => SERVICE_BY_ID.get(id)?.label ?? id);
}

/** True when every selected service is routine enough to promise same-day. */
export function isLikelySameDay(ids: string[]): boolean {
  return ids.length > 0 && ids.every((id) => SERVICE_BY_ID.get(id)?.sameDay);
}

export const PICKUP_WINDOWS = [
  { id: "am", label: "Morning", detail: "7:00 – 10:00 AM" },
  { id: "midday", label: "Midday", detail: "10:00 AM – 1:00 PM" },
  { id: "pm", label: "Afternoon", detail: "1:00 – 4:00 PM" },
  { id: "eve", label: "Evening", detail: "4:00 – 7:00 PM" },
];

export const KEY_HANDOFF = [
  { id: "in_person", label: "I'll hand the keys over" },
  { id: "hidden", label: "Keys left somewhere (I'll say where)" },
  { id: "lockbox", label: "Lockbox / valet at my building" },
];
