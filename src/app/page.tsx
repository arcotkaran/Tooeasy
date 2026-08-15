import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PostcodeCheck } from "@/components/PostcodeCheck";
import { Faq } from "@/components/Faq";
import { SERVICES } from "@/lib/services";

const STEPS = [
  {
    n: "01",
    t: "Tell us the car and what it needs",
    d: "Two minutes on your phone. Pick a pickup window that suits you — before work, or after you get home.",
  },
  {
    n: "02",
    t: "A driver collects it from your driveway",
    d: "You get their name by text before they arrive. They walk the car, photograph every panel with you, and drive it to the workshop.",
  },
  {
    n: "03",
    t: "The workshop takes it from there",
    d: "They inspect it and talk to you directly about what it needs. When it's done, the same driver brings it home.",
  },
];

const TRUST = [
  {
    t: "Insured, licence-checked drivers",
    d: "Driving records checked, not just police checks. Your car is covered from the second we take the keys.",
  },
  {
    t: "Photos before we pull away",
    d: "Every panel, wheel and the odometer, timestamped at pickup and again when we hand it back. No arguments about a scratch.",
  },
  {
    t: "The workshop talks to you direct",
    d: "We move your car and keep you posted. What the car needs is a conversation between you and your mechanic — we stay out of it.",
  },
  {
    t: "You always know where it is",
    d: "A text at every step, from the driver setting off to your car back in the driveway. No wondering, no chasing.",
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-ink">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-line/60 bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="flex items-center gap-1.5">
            <Link
              href="/book"
              className="rounded-full bg-acid px-4 py-2 text-sm font-semibold text-black transition hover:bg-acid-dim"
            >
              Book pickup
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="glow relative overflow-hidden px-5 pt-12 pb-16 sm:pt-20">
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14">
            <div>
              <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-acid">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acid" />
                Now serving Wentworthville &amp; nearby
              </span>

              <h1 className="display mt-6 text-[3.1rem] leading-[0.94] sm:text-7xl lg:text-[5.2rem]">
                Your car goes
                <br />
                to the mechanic.
                <br />
                <span className="text-acid">You don&rsquo;t.</span>
              </h1>

              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted sm:text-lg">
                We collect your car from your driveway, take it to a trusted
                local workshop, and bring it back when it&rsquo;s done. You
                never leave the house.
              </p>

              <div className="mt-8 max-w-md">
                <PostcodeCheck />
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-[13px] text-muted">
                {[
                  "Two-minute booking",
                  "Insured drivers",
                  "Cancel any time",
                ].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <span className="text-acid">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hero photo with a live-tracking chip floating over it */}
            <div className="relative mt-12 lg:mt-0">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-line">
                <Image
                  src="/img/hero.webp"
                  alt="A Too Easy driver taking car keys from a customer in their driveway"
                  width={928}
                  height={1160}
                  priority
                  className="h-[420px] w-full object-cover object-center sm:h-[520px] lg:h-[600px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
              </div>

              <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-line bg-surface/95 p-4 backdrop-blur-xl sm:left-6 sm:right-6">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acid opacity-70" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-acid" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-fg">
                      Dave is 4 minutes away
                    </p>
                    <p className="truncate text-[12px] text-muted">
                      Booking TE-4K9P2 · 2021 Mazda CX-5
                    </p>
                  </div>
                  <span className="eyebrow shrink-0 rounded-full bg-acid/15 px-2.5 py-1 text-acid">
                    Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust marquee ──────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-line bg-surface/40 py-3.5">
        <div className="marquee flex w-max gap-8 whitespace-nowrap text-[13px] text-muted">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex gap-8" aria-hidden={dup === 1}>
              {[
                "Insured drivers",
                "Licence-checked",
                "Photo condition report",
                "Trusted local workshop",
                "Same-day on routine work",
                "Text updates start to finish",
                "Cancel any time",
              ].map((x) => (
                <span key={x} className="flex items-center gap-8">
                  {x}
                  <span className="text-acid">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <span className="eyebrow text-acid">How it works</span>
          <h2 className="display mt-3 max-w-2xl text-[2.4rem] leading-[1.02] sm:text-5xl">
            Three taps, one driveway visit, no day off work.
          </h2>

          <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <div className="display text-[3.5rem] leading-none text-line">
                  {s.n}
                </div>
                <h3 className="display mt-3 text-xl leading-snug">{s.t}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
                  {s.d}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 overflow-hidden rounded-[1.75rem] border border-line">
            <Image
              src="/img/drive.webp"
              alt="A Too Easy driver carefully driving a customer's car to the workshop"
              width={1456}
              height={816}
              className="h-56 w-full object-cover sm:h-80 lg:h-[420px]"
            />
          </div>
        </div>
      </section>

      {/* ── What we are (and aren't) ───────────────────────────── */}
      <section className="border-y border-line bg-surface/30 px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <span className="eyebrow text-acid">Where we fit</span>
            <h2 className="display mt-3 text-[2.4rem] leading-[1.02] sm:text-5xl">
              We move your car.
              <br />
              <span className="text-acid">Your mechanic does the rest.</span>
            </h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted">
              Too Easy is the booking and transport bit — the part that normally
              costs you a morning, a lift home and a day without a car. The
              workshop inspects your car and speaks to you directly about what
              it needs. We don&rsquo;t sit in the middle of that conversation.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                "You book a pickup window that suits you",
                "We collect, photograph and deliver your car",
                "The workshop contacts you about the work",
                "We bring it back and hand it over the same way",
              ].map((x) => (
                <li key={x} className="flex gap-3 text-[15px] text-fg">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-acid" />
                  {x}
                </li>
              ))}
            </ul>
          </div>

          {/* Status mock — what Too Easy actually gives you */}
          <div className="mt-12 lg:mt-0">
            <div className="mx-auto max-w-sm rounded-[1.75rem] border border-line bg-ink p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-muted">Booking · TE-4K9P2</span>
                <span className="eyebrow rounded-full bg-acid/15 px-2.5 py-1 text-acid">
                  At the workshop
                </span>
              </div>
              <p className="display mt-4 text-lg">2021 Mazda CX-5</p>
              <p className="text-[13px] text-muted">
                Logbook service · 62,140 km
              </p>

              <ol className="mt-5 space-y-0 border-t border-line pt-4">
                {[
                  ["Booked", "Tue 7:12am", true],
                  ["Dave collected your car", "Wed 8:04am", true],
                  ["Arrived at the workshop", "Wed 8:26am", true],
                  ["Workshop has your car", "In progress", false],
                  ["On the way back to you", "", false],
                ].map(([label, time, done], i, arr) => (
                  <li key={label as string} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${
                          done
                            ? "border-acid bg-acid text-black"
                            : i === 3
                              ? "border-acid text-acid"
                              : "border-line text-transparent"
                        }`}
                      >
                        {done ? "✓" : "·"}
                      </span>
                      {i < arr.length - 1 && (
                        <span
                          className={`w-px flex-1 ${done ? "bg-acid/50" : "bg-line"}`}
                          style={{ minHeight: "1.5rem" }}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <p
                        className={`text-[14px] leading-tight ${
                          i === 3 ? "font-semibold text-acid" : done ? "text-fg" : "text-muted"
                        }`}
                      >
                        {label as string}
                      </p>
                      {time ? (
                        <p className="mt-0.5 text-[12px] text-muted">
                          {time as string}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ───────────────────────────────────────────── */}
      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <span className="eyebrow text-acid">What you can book it in for</span>
          <h2 className="display mt-3 max-w-2xl text-[2.4rem] leading-[1.02] sm:text-5xl">
            Everything a good local workshop does.
          </h2>
          <p className="mt-4 max-w-lg text-[15px] text-muted">
            Not sure what&rsquo;s wrong? That&rsquo;s a normal booking. Pick
            &ldquo;take a look&rdquo; and the workshop will diagnose it.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div
                key={s.id}
                className="group rounded-2xl border border-line bg-surface/40 p-5 transition hover:border-acid/40 hover:bg-surface"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="display text-[17px] leading-snug">{s.label}</h3>
                  {s.sameDay && (
                    <span className="eyebrow mt-0.5 shrink-0 rounded-full bg-acid/12 px-2 py-1 text-[9px] text-acid">
                      Same day
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[14px] text-muted">{s.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Same-day honesty ───────────────────────────────────── */}
      <section className="border-y border-line bg-surface/30 px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
            <div className="overflow-hidden rounded-[1.75rem] border border-line">
              <Image
                src="/img/shop.webp"
                alt="A modern, clean workshop with a car on a hoist being inspected"
                width={1024}
                height={1024}
                className="h-64 w-full object-cover sm:h-96 lg:h-[480px]"
              />
            </div>

            <div className="mt-12 lg:mt-0">
              <span className="eyebrow text-acid">
                &ldquo;But I need my car&rdquo;
              </span>
              <h2 className="display mt-3 text-[2.4rem] leading-[1.02] sm:text-5xl">
                We&rsquo;ll tell you the truth about timing.
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-muted">
                Most jobs don&rsquo;t need your car overnight. The ones that do,
                you&rsquo;ll hear about from the workshop early — not at 5pm
                when you&rsquo;re expecting it back.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-acid/30 bg-acid/[0.06] p-5">
                  <p className="eyebrow text-acid">Gone by 9, back by 6</p>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-fg">
                    Logbook service, oil, tyres, brakes, battery and pink slips.
                    Routine work, same-day return.
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-ink p-5">
                  <p className="eyebrow text-muted">Needs a look first</p>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-fg">
                    Engine lights, odd noises, air con and suspension. We pick it
                    up, the workshop diagnoses it, and they give you a real
                    timeline before anything goes ahead.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust ──────────────────────────────────────────────── */}
      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <span className="eyebrow text-acid">Handing over your keys</span>
          <h2 className="display mt-3 max-w-2xl text-[2.4rem] leading-[1.02] sm:text-5xl">
            We know exactly how big a deal this is.
          </h2>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[1.5rem] border border-line bg-line sm:grid-cols-2">
            {TRUST.map((x) => (
              <div key={x.t} className="bg-ink p-7">
                <h3 className="display text-[19px] leading-snug">{x.t}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
                  {x.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section className="px-5 pb-20 sm:pb-28">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow text-acid">Questions</span>
          <h2 className="display mt-3 mb-10 text-[2.4rem] leading-[1.02] sm:text-5xl">
            The things people ask us.
          </h2>
          <Faq />
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="glow relative overflow-hidden border-t border-line px-5 py-24 sm:py-32">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="display text-[2.8rem] leading-[0.98] sm:text-6xl">
            Stop planning your week
            <br />
            around a <span className="text-acid">service booking.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[17px] text-muted">
            Check your postcode. If we&rsquo;re on your street, you can book a
            pickup in about two minutes.
          </p>
          <div className="mx-auto mt-9 max-w-md">
            <PostcodeCheck />
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-line px-5 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-muted">
                Car service pickup and return around Wentworthville, for people
                whose time is worth more than a waiting room.
              </p>
            </div>
            <nav className="flex flex-col gap-2.5 text-[14px] text-muted">
              <Link href="/book" className="transition hover:text-fg">
                Book a pickup
              </Link>
              <a
                href="mailto:hello@tooeasy.com.au"
                className="transition hover:text-fg"
              >
                hello@tooeasy.com.au
              </a>
            </nav>
          </div>
          <p className="mt-10 border-t border-line pt-6 text-[13px] text-muted">
            © {new Date().getFullYear()} Too Easy. Vehicle transport by
            insured, licence-checked drivers. Servicing carried out by
            independent workshops.
          </p>
        </div>
      </footer>
    </main>
  );
}
