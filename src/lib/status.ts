export type Role = "customer" | "driver" | "mechanic" | "admin";

export type StatusDef = {
  id: string;
  /** Internal / ops wording. */
  label: string;
  /** What the customer reads on the tracking page. */
  customer: string;
  /** Which of the six tracker milestones this status sits in. */
  step: number;
  /** Roles allowed to move a booking *into* this status. */
  setBy: Role[];
};

export const STATUSES: StatusDef[] = [
  { id: "requested",       label: "Requested",           customer: "Request received",        step: 0, setBy: ["customer"] },
  { id: "confirmed",       label: "Confirmed",           customer: "Pickup confirmed",        step: 0, setBy: ["admin"] },
  { id: "driver_assigned", label: "Driver assigned",     customer: "Driver assigned",         step: 1, setBy: ["admin"] },
  { id: "en_route_pickup", label: "Driver en route",     customer: "Driver on the way to you", step: 1, setBy: ["driver", "admin"] },
  { id: "picked_up",       label: "Car picked up",       customer: "Car collected",           step: 2, setBy: ["driver", "admin"] },
  { id: "at_garage",       label: "Dropped at shop",     customer: "At the shop",             step: 3, setBy: ["driver", "mechanic", "admin"] },
  { id: "quote_pending",   label: "Quote sent",          customer: "Estimate ready for you",  step: 3, setBy: ["mechanic", "admin"] },
  { id: "quote_approved",  label: "Quote approved",      customer: "Work approved",           step: 4, setBy: ["customer", "admin"] },
  { id: "in_service",      label: "In service",          customer: "Work underway",           step: 4, setBy: ["mechanic", "admin"] },
  { id: "ready",           label: "Ready for return",    customer: "Work complete",           step: 4, setBy: ["mechanic", "admin"] },
  { id: "en_route_return", label: "Driver returning car", customer: "Car on the way back",    step: 5, setBy: ["driver", "admin"] },
  { id: "delivered",       label: "Delivered",           customer: "Car returned",            step: 5, setBy: ["driver", "admin"] },
  { id: "cancelled",       label: "Cancelled",           customer: "Cancelled",               step: -1, setBy: ["customer", "admin"] },
];

export const STATUS_BY_ID = new Map(STATUSES.map((s) => [s.id, s]));

export const TRACKER_STEPS = [
  "Booked",
  "Driver on the way",
  "Car picked up",
  "At the shop",
  "Work underway",
  "Car returned",
];

export function statusLabel(id: string): string {
  return STATUS_BY_ID.get(id)?.label ?? id;
}

export function customerStatus(id: string): string {
  return STATUS_BY_ID.get(id)?.customer ?? id;
}

export function statusStep(id: string): number {
  return STATUS_BY_ID.get(id)?.step ?? 0;
}

export function canSetStatus(role: Role, statusId: string): boolean {
  const def = STATUS_BY_ID.get(statusId);
  if (!def) return false;
  return role === "admin" || def.setBy.includes(role);
}

export function isTerminal(id: string): boolean {
  return id === "delivered" || id === "cancelled";
}
