"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SERVICES, PICKUP_WINDOWS, KEY_HANDOFF, isLikelySameDay } from "@/lib/services";
import { submitBooking } from "@/lib/submitBooking";
import { DateTimePicker } from "@/components/DateTimePicker";

/** Dates are stored as ISO but always shown to the customer Australian-style. */
const formatAU = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
};

type Form = {
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleOdometer: string;
  services: string[];
  concern: string;
  pickupAddress: string;
  pickupPostcode: string;
  pickupDate: string;
  pickupWindow: string;
  keyHandoff: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

const STEP_TITLES = ["Your car", "What's needed", "Where & when", "Confirm"];

const field =
  "w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-ink placeholder:text-muted/60 outline-none transition focus:border-brand/60";
const label = "mb-1.5 block text-[13px] font-medium text-muted";

export function BookingForm({
  defaultName = "",
  defaultEmail = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [f, setF] = useState<Form>({
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    vehiclePlate: "",
    vehicleOdometer: "",
    services: [],
    concern: "",
    pickupAddress: "",
    pickupPostcode: "",
    pickupDate: today,
    pickupWindow: PICKUP_WINDOWS[0].id,
    keyHandoff: "in_person",
    contactName: defaultName,
    contactPhone: "",
    contactEmail: defaultEmail,
  });

  // Static export has no server-side searchParams, so carry the postcode over
  // from the landing-page coverage check on the client.
  useEffect(() => {
    const pc = new URLSearchParams(window.location.search).get("postcode");
    if (pc && /^\d{4}$/.test(pc)) {
      setF((prev) => ({ ...prev, pickupPostcode: pc }));
    }
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const toggleService = (id: string) =>
    setF((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id],
    }));

  function validate(s: number): string | null {
    if (s === 0) {
      if (!f.vehicleMake.trim() || !f.vehicleModel.trim())
        return "Tell us the make and model.";
    }
    if (s === 1 && f.services.length === 0)
      return "Pick at least one thing to look at.";
    if (s === 2) {
      if (!f.pickupAddress.trim()) return "We need the pickup address — home or office is fine.";
      if (!/^\d{4}$/.test(f.pickupPostcode.trim()))
        return "Enter a 4-digit postcode.";
      if (!f.pickupDate) return "Pick a pickup date.";
    }
    if (s === 3) {
      if (!f.contactName.trim()) return "Add a name for the driver to ask for.";
      if (f.contactPhone.replace(/\D/g, "").length < 10)
        return "Add a phone number we can text.";
      if (!f.contactEmail.includes("@")) return "Add an email for your confirmation.";
    }
    return null;
  }

  function next() {
    const err = validate(step);
    if (err) return setError(err);
    setError(null);
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    const err = validate(3);
    if (err) return setError(err);
    setError(null);
    setSaving(true);
    try {
      const result = await submitBooking(f);
      if ("error" in result) {
        setError(result.error);
        setSaving(false);
        return;
      }
      setDone(result.ref);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network problem. Try again.");
      setSaving(false);
    }
  }

  const sameDay = isLikelySameDay(f.services);

  // ── Confirmation ─────────────────────────────────────────
  if (done) {
    return (
      <div className="rise py-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl text-white">
          ✓
        </span>
        <h1 className="display mt-6 text-[2.3rem] leading-[1.05]">
          Request received.
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-muted">
          Your reference is{" "}
          <span className="font-semibold text-brand">{done}</span>. We&rsquo;re
          booking the slot with the workshop now — you&rsquo;ll get a text on{" "}
          {f.contactPhone} confirming your pickup, usually within a couple of
          hours. Nothing is locked in until then.
        </p>

        <div className="mt-8 rounded-2xl border border-line bg-surface/50 p-5">
          <p className="eyebrow text-muted">What happens next</p>
          <ol className="mt-4 space-y-3.5 text-[15px]">
            {[
              "We book your slot with the workshop and confirm your pickup time.",
              "Your driver texts you before they set off, then photographs the car with you at handover.",
              "The mechanic rings you to talk through the work before they start — every time, even for a routine service.",
              "If they find anything else along the way, they ring you again. Nothing happens without your say-so.",
              "You settle up with the workshop by card, and your driver brings the car home.",
            ].map((x, i) => (
              <li key={x} className="flex gap-3">
                <span className="display shrink-0 text-brand">{i + 1}</span>
                <span className="text-muted">{x}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-6 text-[14px] leading-relaxed text-muted">
          Need to change or cancel? Reply to the confirmation text, or email{" "}
          <a
            href="mailto:hello@tooeasy.com.au"
            className="text-brand underline underline-offset-4"
          >
            hello@tooeasy.com.au
          </a>{" "}
          quoting {done}.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-full border border-line px-6 py-3.5 text-[15px] text-muted transition hover:text-ink"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex gap-1.5">
          {STEP_TITLES.map((t, i) => (
            <div
              key={t}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-brand" : "bg-line"
              }`}
            />
          ))}
        </div>
        <p className="eyebrow mt-3 text-muted">
          Step {step + 1} of 4 · {STEP_TITLES[step]}
        </p>
      </div>

      {/* ── Step 0: car ─────────────────────────────────────── */}
      {step === 0 && (
        <div className="rise">
          <h1 className="display text-[2.1rem] leading-[1.05]">
            Which car are we
            <br />
            picking up?
          </h1>
          <p className="mt-3 text-[15px] text-muted">
            The workshop needs this to check parts before your car arrives.
          </p>

          <div className="mt-8 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={label}>Year</label>
                <input
                  inputMode="numeric"
                  maxLength={4}
                  value={f.vehicleYear}
                  onChange={(e) =>
                    set("vehicleYear", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="2021"
                  className={field}
                />
              </div>
              <div className="col-span-2">
                <label className={label}>Make *</label>
                <input
                  value={f.vehicleMake}
                  onChange={(e) => set("vehicleMake", e.target.value)}
                  placeholder="Mazda"
                  className={field}
                />
              </div>
            </div>

            <div>
              <label className={label}>Model *</label>
              <input
                value={f.vehicleModel}
                onChange={(e) => set("vehicleModel", e.target.value)}
                placeholder="CX-5"
                className={field}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Rego</label>
                <input
                  value={f.vehiclePlate}
                  onChange={(e) =>
                    set("vehiclePlate", e.target.value.toUpperCase())
                  }
                  placeholder="DKR 42N"
                  className={field}
                />
              </div>
              <div>
                <label className={label}>Odometer (km)</label>
                <input
                  inputMode="numeric"
                  value={f.vehicleOdometer}
                  onChange={(e) =>
                    set("vehicleOdometer", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="62000"
                  className={field}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: services ────────────────────────────────── */}
      {step === 1 && (
        <div className="rise">
          <h1 className="display text-[2.1rem] leading-[1.05]">
            What should the
            <br />
            workshop look at?
          </h1>
          <p className="mt-3 text-[15px] text-muted">
            Pick everything that applies. Not sure? Choose &ldquo;take a
            look&rdquo; and describe it below.
          </p>

          <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
            {SERVICES.map((s) => {
              const on = f.services.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  aria-pressed={on}
                  className={`rounded-2xl border p-4 text-left transition ${
                    on
                      ? "border-brand bg-brand/[0.08]"
                      : "border-line bg-surface/40 hover:bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="display text-[16px] leading-snug">
                      {s.label}
                    </span>
                    <span
                      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        on
                          ? "border-brand bg-brand text-white"
                          : "border-line text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-muted">{s.blurb}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <label className={label}>
              Anything else the mechanic should know?
            </label>
            <textarea
              rows={4}
              value={f.concern}
              onChange={(e) => set("concern", e.target.value)}
              placeholder="Grinding noise when I brake, mostly in the morning…"
              className={`${field} resize-none`}
            />
          </div>

          {f.services.length > 0 && (
            <div
              className={`mt-5 rounded-2xl border p-4 ${
                sameDay
                  ? "border-brand/30 bg-brand/[0.06]"
                  : "border-line bg-surface/50"
              }`}
            >
              <p className={`eyebrow ${sameDay ? "text-brand" : "text-muted"}`}>
                {sameDay ? "Likely same-day" : "Needs a look first"}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-ink">
                {sameDay
                  ? "This is routine work — expect the car back the same evening. We'll confirm when we book the workshop slot."
                  : "The workshop will diagnose it first and contact you directly with a timeline before anything goes ahead."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: where & when ────────────────────────────── */}
      {step === 2 && (
        <div className="rise">
          <h1 className="display text-[2.1rem] leading-[1.05]">
            Where and when
            <br />
            do we collect it?
          </h1>

          <div className="mt-8 space-y-4">
            <div>
              <label className={label}>Pickup address (home or office) *</label>
              <input
                value={f.pickupAddress}
                onChange={(e) => set("pickupAddress", e.target.value)}
                placeholder="12 Station Street, Wentworthville"
                className={field}
              />
            </div>

            <div>
              <label className={label}>Postcode *</label>
              <input
                inputMode="numeric"
                maxLength={5}
                value={f.pickupPostcode}
                onChange={(e) =>
                  set("pickupPostcode", e.target.value.replace(/\D/g, ""))
                }
                placeholder="2145"
                className={`${field} max-w-[9rem]`}
              />
            </div>

            <DateTimePicker
              date={f.pickupDate}
              window={f.pickupWindow}
              onDateChange={(d) => set("pickupDate", d)}
              onWindowChange={(w) => set("pickupWindow", w)}
            />

            <div>
              <label className={label}>How will the driver get the keys?</label>
              <div className="space-y-2.5">
                {KEY_HANDOFF.map((k) => {
                  const on = f.keyHandoff === k.id;
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => set("keyHandoff", k.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                        on
                          ? "border-brand bg-brand/[0.08]"
                          : "border-line bg-surface/40"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 shrink-0 rounded-full border-2 transition ${
                          on ? "border-brand bg-brand" : "border-line"
                        }`}
                      />
                      <span className="text-[15px]">{k.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: confirm ─────────────────────────────────── */}
      {step === 3 && (
        <div className="rise">
          <h1 className="display text-[2.1rem] leading-[1.05]">
            Last thing —
            <br />
            how do we reach you?
          </h1>

          <div className="mt-8 space-y-4">
            <div>
              <label className={label}>Name at pickup *</label>
              <input
                value={f.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                placeholder="Alex Nguyen"
                className={field}
              />
            </div>
            <div>
              <label className={label}>Mobile number *</label>
              <input
                type="tel"
                inputMode="tel"
                value={f.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                placeholder="0412 345 678"
                className={field}
              />
            </div>
            <div>
              <label className={label}>Email *</label>
              <input
                type="email"
                inputMode="email"
                value={f.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                placeholder="you@email.com"
                className={field}
              />
              <p className="mt-1.5 text-[13px] text-muted">
                Used for your confirmation and driver updates, and so the
                workshop can reach you. Nothing else.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-surface/50 p-5">
            <p className="eyebrow text-brand">Your booking</p>
            <dl className="mt-4 space-y-3 text-[14px]">
              {[
                [
                  "Car",
                  [f.vehicleYear, f.vehicleMake, f.vehicleModel]
                    .filter(Boolean)
                    .join(" "),
                ],
                [
                  "Work",
                  f.services
                    .map((id) => SERVICES.find((s) => s.id === id)?.label)
                    .filter(Boolean)
                    .join(", "),
                ],
                ["Pickup", `${f.pickupAddress}, ${f.pickupPostcode}`],
                [
                  "When",
                  `${formatAU(f.pickupDate)} · ${
                    PICKUP_WINDOWS.find((w) => w.id === f.pickupWindow)?.detail
                  }`,
                ],
                [
                  "Keys",
                  KEY_HANDOFF.find((k) => k.id === f.keyHandoff)?.label ?? "",
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6">
                  <dt className="shrink-0 text-muted">{k}</dt>
                  <dd className="text-right text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-muted">
              We&rsquo;ll confirm your slot with the workshop and text you.
              Cancel any time before the driver sets off.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-5 rounded-xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-[14px] text-red-700">
          {error}
        </p>
      )}

      {/* Sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-page/95 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl gap-3">
          {step > 0 && (
            <button
              onClick={back}
              className="rounded-full border border-line px-6 py-4 text-[15px] text-muted transition hover:text-ink"
            >
              Back
            </button>
          )}
          <button
            onClick={step === 3 ? submit : next}
            disabled={saving}
            className="flex-1 rounded-full bg-brand px-6 py-4 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Booking…" : step === 3 ? "Confirm pickup" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
