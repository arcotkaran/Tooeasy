export type Role = "admin" | "customer" | "driver" | "mechanic";

export type StatusDef = {
  id: string;
  label: string;
  /** What the customer sees. */
  customer: string;
  /** Roles allowed to move a booking into this status. */
  setBy: Role[];
};

export const STATUSES: StatusDef[] = [
  { id: "requested",       label: "Requested",          customer: "Request received",         setBy: ["customer"] },
  { id: "confirmed",       label: "Confirmed with shop", customer: "Pickup confirmed",        setBy: ["admin"] },
  { id: "driver_assigned", label: "Driver assigned",    customer: "Driver assigned",          setBy: ["admin"] },
  { id: "en_route_pickup", label: "Driver on the way",  customer: "Driver on the way to you", setBy: ["driver", "admin"] },
  { id: "picked_up",       label: "Car collected",      customer: "Car collected",            setBy: ["driver", "admin"] },
  { id: "at_workshop",     label: "At the workshop",    customer: "At the workshop",          setBy: ["driver", "mechanic", "admin"] },
  { id: "in_service",      label: "Work underway",      customer: "Work underway",            setBy: ["mechanic", "admin"] },
  { id: "ready",           label: "Ready for return",   customer: "Work complete",            setBy: ["mechanic", "admin"] },
  { id: "en_route_return", label: "On the way back",    customer: "Car on the way back",      setBy: ["driver", "admin"] },
  { id: "delivered",       label: "Delivered",          customer: "Car returned",             setBy: ["driver", "admin"] },
  { id: "cancelled",       label: "Cancelled",          customer: "Cancelled",                setBy: ["customer", "admin"] },
];

export const STATUS_BY_ID = new Map(STATUSES.map((s) => [s.id, s]));

export const statusLabel = (id: string) => STATUS_BY_ID.get(id)?.label ?? id;
export const customerStatus = (id: string) => STATUS_BY_ID.get(id)?.customer ?? id;

export function canSet(role: Role, statusId: string): boolean {
  const def = STATUS_BY_ID.get(statusId);
  if (!def) return false;
  return role === "admin" || def.setBy.includes(role);
}

export const isTerminal = (id: string) => id === "delivered" || id === "cancelled";

/** What this role can do next, given where the booking is. */
export function nextActions(role: Role, status: string): { status: string; label: string }[] {
  if (role === "driver") {
    switch (status) {
      case "driver_assigned": return [{ status: "en_route_pickup", label: "Start drive to customer" }];
      case "en_route_pickup": return [{ status: "picked_up", label: "Car collected" }];
      case "picked_up":       return [{ status: "at_workshop", label: "Dropped at workshop" }];
      case "ready":           return [{ status: "en_route_return", label: "Driving car back" }];
      case "en_route_return": return [{ status: "delivered", label: "Delivered to customer" }];
      default: return [];
    }
  }
  if (role === "mechanic") {
    switch (status) {
      case "at_workshop": return [{ status: "in_service", label: "Start work" }];
      case "in_service":  return [{ status: "ready", label: "Work complete" }];
      default: return [];
    }
  }
  if (role === "admin") {
    if (status === "requested") return [{ status: "confirmed", label: "Confirm with workshop" }];
    return [];
  }
  return [];
}
