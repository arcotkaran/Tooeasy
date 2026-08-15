"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SuburbPicker } from "@/components/SuburbPicker";
import { isCovered, type Suburb } from "@/lib/geo";
import { joinWaitlistAction } from "@/app/actions";

/**
 * The qualifying question, answered instantly. Coverage is decided from the
 * suburb list in the bundle, so there's no round trip and no waiting spinner.
 */
export function SuburbCheck() {
  const router = useRouter();
  const [suburb, setSuburb] = useState<Suburb | null>(null);

  const [email, setEmail] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const covered = suburb ? isCovered(suburb) : null;

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!suburb) return;
    setJoining(true);
    try {
      const fd = new FormData();
      fd.set("email", email);
      fd.set("suburb", suburb.name);
      fd.set("postcode", suburb.postcode);
      fd.set("vehicle", vehicle);
      const res = await joinWaitlistAction({}, fd);
      if (res.error) setJoinError(res.error);
      else setJoined(true);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div>
      <SuburbPicker value={suburb} onSelect={setSuburb} />

      {covered === true && suburb && (
        <div className="mt-3 rounded-2xl border border-brand/35 bg-brand/[0.07] p-5 rise">
          <div className="flex items-start gap-3">
            <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
              ✓
            </span>
            <div>
              <p className="display text-lg">Yes — we collect in {suburb.name}.</p>
              <p className="mt-1 text-sm text-muted">
                Pick a day and a window that suits and we&rsquo;ll come to you.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              router.push(
                `/book?suburb=${encodeURIComponent(suburb.name)}&postcode=${suburb.postcode}`,
              )
            }
            className="mt-4 w-full rounded-full bg-brand px-6 py-4 text-[15px] font-semibold text-white transition hover:bg-brand-dark active:scale-[0.99]"
          >
            Book my pickup →
          </button>
        </div>
      )}

      {covered === false && suburb && (
        <div className="mt-3 rounded-2xl border border-line bg-surface p-5 rise">
          {joined ? (
            <div className="py-2 text-center">
              <p className="display text-lg">You&rsquo;re on the list.</p>
              <p className="mt-1.5 text-sm text-muted">
                We&rsquo;ll email you the day we reach {suburb.name}. Requests
                like yours are how we choose the next suburb.
              </p>
            </div>
          ) : (
            <>
              <p className="display text-lg">Not in {suburb.name} yet.</p>
              <p className="mt-1.5 text-sm text-muted">
                We only open a suburb when we can promise a quick pickup. Leave
                your email and we&rsquo;ll tell you the day we get there.
              </p>
              <form onSubmit={join} className="mt-4 space-y-2.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-xl border border-line bg-page px-4 py-3.5 text-ink placeholder:text-muted/60 outline-none focus:border-brand/60"
                />
                <input
                  type="text"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  placeholder="Your car (e.g. 2019 Mazda CX-5)"
                  className="w-full rounded-xl border border-line bg-page px-4 py-3.5 text-ink placeholder:text-muted/60 outline-none focus:border-brand/60"
                />
                <button
                  type="submit"
                  disabled={joining}
                  className="w-full rounded-full bg-brand px-6 py-3.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
                >
                  {joining ? "Adding you…" : "Tell me when you're here"}
                </button>
                {joinError && (
                  <p className="text-[13px] text-red-700">{joinError}</p>
                )}
              </form>
            </>
          )}
        </div>
      )}

      {!suburb && (
        <p className="mt-2.5 px-2 text-[13px] text-muted">
          Two-minute booking · Cancel any time
        </p>
      )}
    </div>
  );
}
