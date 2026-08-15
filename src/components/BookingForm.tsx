"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SERVICES, PICKUP_WINDOWS, KEY_HANDOFF, isLikelySameDay } from "@/lib/services";
import { submitBooking } from "@/lib/submitBooking";
import { DateTimePicker } from "@/components/DateTimePicker";
import { SuburbPicker } from "@/components/SuburbPicker";
import { findSuburb, isCovered, type Suburb } from "@/lib/geo";

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
  vehicle: string;
  services: string[];
  concern: string;
  pickupAddress: string;
  suburb: string;
  postcode: string;
  pickupDate: string;
  pickupWindow: string;
  keyHandoff: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

const STEP_TITLES = ["What's needed", "Where & when", "Your details"];

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
  const [suburb, setSuburb] = useState<Suburb | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [f, setF] = useState<Form>({
    vehicle: "",
    services: [],
    concern: "",
    pickupAddress: "",
    suburb: "",
    postcode: "",
    pickupDate: today,
    pickupWindow: PICKUP_WINDOWS[0].id,
    keyHandoff: "in_person",
    contactName: defaultName,
    contactPhone: "",
    contactEmail: defaultEmail,
  });

  // Static export has no server-side searchParams, so carry the suburb chosen
  // on the landing page across on the client.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const name = p.get("suburb");
    const postcode = p.get("postcode");
    if (name && postcode) {
      const match = findSuburb(name, postcode);
      if (match && isCovered(match)) {
        setSuburb(match);
        setF((prev) => ({ ...prev, suburb: match.name, postcode: match.postcode }));
      }
    }
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const pickSuburb = (s: Suburb | null) => {
    setSuburb(s);
    setF((prev) => ({
      ...prev,
      suburb: s?.name ?? "",
      postcode: s?.postcode ?? "",
    }));
  };

  const toggleService = (id: string) =>
    setF((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id],
    }));

  function validate(s: number): string | null {
    if (s === 0) {
      if (!f.vehicle.trim()) return "Tell us which car we're collecting.";
      if (f.services.length === 0) return "Pick at least one thing to look at.";
    }
    if (s === 1) {
      if (!f.pickupAddress.trim())
        return "We need the pickup address — home or work is fine.";
      if (!suburb) return "Pick your suburb from the list.";
      if (!isCovered(suburb)) return "We don't collect from that suburb yet.";
      if (!f.pickupDate) return "Pick a pickup day.";
    }
    if (s === 2) {
      if (!f.contactName.trim()) return "Add a name for the driver to ask for.";
      if (f.contactPhone.replace(/\D/g, "").length < 10)
        return "Add a mobile number we can text.";
    }
    return null;
  }

  function next() {
    const err = validate(step);
    if (err) return setError(err);
    setError(null);
    setStep((s) => Math.min(s + 1, 2));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    const err = validate(2);
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
              "We book your slot with the workshop and text you to confirm the pickup.",
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
          Step {step + 1} of 3 · {STEP_TITLES[step]}
        </p>
      </div>

      {/* ── Step 0: car + what's needed ─────────────────────── */}
      {step === 0 && (
        <div className="rise">
          <h1 className="display text-[2.1rem] leading-[1.05]">
            What does your
            <br />
            car need?
          </h1>

          <div className="mt-8">
            <label className={label}>Which car? *</label>
            <input
              value={f.vehicle}
              onChange={(e) => set("vehicle", e.target.value)}
              placeholder="2019 Mazda CX-5"
              className={field}
            />
            <p className="mt-1.5 text-[13px] text-muted">
              Make and model is plenty — the workshop sorts the rest when they
              ring you.
            </p>
          </div>

          <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
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
                      : "border-line bg-surface hover:border-brand/40"
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
              Anything the mechanic should know? (optional)
            </label>
            <textarea
              rows={3}
              value={f.concern}
              onChange={(e) => set("concern", e.target.value)}
              placeholder="Grinding noise when I brake, mostly in the morning…"
              className={`${field} resize-none`}
            />
          </div>

          {f.services.length > 0 && (
            <div
              className={`mt-5 rounded-2xl border p-4 ${
                sameDay ? "border-brand/30 bg-brand/[0.06]" : "border-line bg-surface"
              }`}
            >
              <p className={`eyebrow ${sameDay ? "text-brand" : "text-muted"}`}>
                {sameDay ? "Usually a same-day job" : "Needs a look first"}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed">
                {sameDay
                  ? "Routine work. If we collect in the morning you'll usually have the car back the same evening."
                  : "The mechanic will diagnose it first and ring you with a timeline before anything goes ahead."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 1: where & when ────────────────────────────── */}
      {step === 1 && (
        <div className="rise">
          <h1 className="display text-[2.1rem] leading-[1.05]">
            Where and when
            <br />
            do we collect it?
          </h1>

          <div className="mt-8 space-y-5">
            <div>
              <label className={label}>Suburb *</label>
              <SuburbPicker value={suburb} onSelect={pickSuburb} />
              {suburb && !isCovered(suburb) && (
                <p className="mt-2 text-[13px] text-red-700">
                  We don&rsquo;t collect from {suburb.name} yet.
                </p>
              )}
            </div>

            <div>
              <label className={label}>Street address (home or work) *</label>
              <input
                value={f.pickupAddress}
                onChange={(e) => set("pickupAddress", e.target.value)}
                placeholder="12 Station Street"
                className={field}
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
                      className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                        on ? "border-brand bg-brand/[0.08]" : "border-line bg-surface"
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

      {/* ── Step 2: your details ────────────────────────────── */}
      {step === 2 && (
        <div className="rise">
          <h1 className="display text-[2.1rem] leading-[1.05]">
            Last thing —
            <br />
            how do we reach you?
          </h1>

          <div className="mt-8 space-y-4">
            <div>
              <label className={label}>Name *</label>
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
              <p className="mt-1.5 text-[13px] text-muted">
                We text your pickup confirmation here, and the mechanic rings
                this number about the work.
              </p>
            </div>
            <div>
              <label className={label}>Email (optional)</label>
              <input
                type="email"
                inputMode="email"
                value={f.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                placeholder="you@email.com"
                className={field}
              />
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-surface/50 p-5">
            <p className="eyebrow text-brand">Your booking</p>
            <dl className="mt-4 space-y-3 text-[14px]">
              {[
                ["Car", f.vehicle],
                [
                  "Work",
                  f.services
                    .map((id) => SERVICES.find((s) => s.id === id)?.label)
                    .filter(Boolean)
                    .join(", "),
                ],
                [
                  "Pickup",
                  `${f.pickupAddress}, ${f.suburb} ${f.postcode}`,
                ],
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
            onClick={step === 2 ? submit : next}
            disabled={saving}
            className="flex-1 rounded-full bg-brand px-6 py-4 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Sending…" : step === 2 ? "Request pickup" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
