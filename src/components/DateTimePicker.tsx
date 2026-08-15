"use client";

import { useMemo, useRef, useEffect } from "react";
import { PICKUP_WINDOWS } from "@/lib/services";

/**
 * Picking the day and window is the main decision the customer makes, so it
 * gets a real calendar strip rather than a native date input.
 *
 * Pickups start tomorrow — we need the lead time to book the slot with the
 * workshop — and Sundays are excluded because the workshop is closed.
 */
function buildDays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (days.length < count) {
    if (cursor.getDay() !== 0) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

export function DateTimePicker({
  date,
  window: windowId,
  onDateChange,
  onWindowChange,
}: {
  date: string;
  window: string;
  onDateChange: (d: string) => void;
  onWindowChange: (w: string) => void;
}) {
  const days = useMemo(() => buildDays(18), []);
  const stripRef = useRef<HTMLDivElement>(null);

  // Default to the first available day rather than today, which we can't service.
  useEffect(() => {
    if (!date || !days.some((d) => iso(d) === date)) {
      onDateChange(iso(days[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = days.find((d) => iso(d) === date) ?? null;
  const windowLabel = PICKUP_WINDOWS.find((w) => w.id === windowId);

  return (
    <div>
      <p className="mb-2.5 text-[13px] font-medium text-muted">Pick a day</p>

      <div
        ref={stripRef}
        className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {days.map((d) => {
          const value = iso(d);
          const on = value === date;
          const weekday = d.toLocaleDateString("en-AU", { weekday: "short" });
          const dayNum = d.getDate();
          const month = d.toLocaleDateString("en-AU", { month: "short" });
          const isTomorrow = d.getTime() === days[0].getTime();

          return (
            <button
              key={value}
              type="button"
              onClick={() => onDateChange(value)}
              aria-pressed={on}
              className={`min-h-[76px] w-[68px] shrink-0 snap-start rounded-2xl border px-2 py-2.5 text-center transition ${
                on
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-surface text-ink hover:border-brand/40"
              }`}
            >
              <span
                className={`block text-[11px] uppercase tracking-wide ${
                  on ? "text-white/80" : "text-muted"
                }`}
              >
                {isTomorrow ? "Tmrw" : weekday}
              </span>
              <span className="display mt-0.5 block text-[22px] leading-none">
                {dayNum}
              </span>
              <span
                className={`block text-[11px] ${on ? "text-white/80" : "text-muted"}`}
              >
                {month}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 mb-2.5 text-[13px] font-medium text-muted">
        Pick a pickup window
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {PICKUP_WINDOWS.map((w) => {
          const on = windowId === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onWindowChange(w.id)}
              aria-pressed={on}
              className={`min-h-[60px] rounded-xl border px-4 py-3 text-left transition ${
                on
                  ? "border-brand bg-brand/[0.08]"
                  : "border-line bg-surface hover:border-brand/40"
              }`}
            >
              <span className="block text-[15px] font-medium">{w.label}</span>
              <span className="block text-[12px] text-muted">{w.detail}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="mt-4 rounded-xl border border-brand/25 bg-brand/[0.06] px-4 py-3 text-[14px] leading-relaxed">
          You&rsquo;re requesting{" "}
          <strong className="font-semibold">
            {selected.toLocaleDateString("en-AU", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </strong>
          , {windowLabel?.detail.toLowerCase()}. We&rsquo;ll book the slot with
          the workshop and text you to confirm — usually within a couple of
          hours.
        </p>
      )}

      <p className="mt-3 text-[13px] text-muted">
        Collections run 9am to 5pm, Monday to Saturday. Morning slots have the
        best chance of the car being back with you the same day.
      </p>
    </div>
  );
}
