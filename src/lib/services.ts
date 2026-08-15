export type ServiceDef = {
  id: string;
  label: string;
  blurb: string;
  /** Routine work the workshop can usually turn around the same day. */
  sameDay: boolean;
};

export const SERVICES: ServiceDef[] = [
  {
    id: "logbook",
    label: "Logbook service",
    blurb: "Keeps your new-car warranty intact",
    sameDay: true,
  },
  {
    id: "oil",
    label: "Oil & filter change",
    blurb: "Full synthetic or mineral",
    sameDay: true,
  },
  {
    id: "tyres",
    label: "Tyres & wheel alignment",
    blurb: "Rotation, balance, puncture, replacement",
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
    blurb: "Slow starts, flat battery, alternator",
    sameDay: true,
  },
  {
    id: "rego",
    label: "Pink slip (eSafety check)",
    blurb: "Rego inspection and re-checks",
    sameDay: true,
  },
  {
    id: "diagnostics",
    label: "Engine light / diagnostics",
    blurb: "Warning light, noise, something feels off",
    sameDay: false,
  },
  {
    id: "aircon",
    label: "Air con & heating",
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
    blurb: "Describe it and the workshop will diagnose",
    sameDay: false,
  },
];

export const SERVICE_BY_ID = new Map(SERVICES.map((s) => [s.id, s]));

export function serviceLabels(ids: string[]): string[] {
  return ids.map((id) => SERVICE_BY_ID.get(id)?.label ?? id);
}

/** True when every selected service is routine enough to expect same-day. */
export function isLikelySameDay(ids: string[]): boolean {
  return ids.length > 0 && ids.every((id) => SERVICE_BY_ID.get(id)?.sameDay);
}

/**
 * We run 9am–5pm: collections start after 9, and we aim to have cars back
 * before 5. Morning slots give the workshop the best chance of a same-day
 * return, so they're listed first.
 */
export const PICKUP_WINDOWS = [
  { id: "am", label: "Morning", detail: "9:00 – 11:00am" },
  { id: "midday", label: "Midday", detail: "11:00am – 1:00pm" },
  { id: "pm", label: "Early afternoon", detail: "1:00 – 3:00pm" },
  { id: "late", label: "Late afternoon", detail: "3:00 – 5:00pm" },
];

export const KEY_HANDOFF = [
  { id: "in_person", label: "I'll hand the keys over" },
  { id: "hidden", label: "Keys left somewhere (I'll say where)" },
  { id: "lockbox", label: "Lockbox / building concierge" },
];
