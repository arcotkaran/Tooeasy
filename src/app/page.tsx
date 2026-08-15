import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SuburbCheck } from "@/components/SuburbCheck";
import { Faq } from "@/components/Faq";
import { CoverageMap } from "@/components/CoverageMap";
import { SERVICES } from "@/lib/services";
import { coveredSuburbs } from "@/lib/geo";

const SUBURB_COUNT = coveredSuburbs().length;

const STEPS = [
  {
    n: "01",
    t: "Ask for a day and a time that suits",
    d: "Two minutes on your phone. We book the slot with the workshop and text you back to confirm it, usually within a couple of hours.",
  },
  {
    n: "02",
    t: "A driver collects it — home or the office",
    d: "You get their name by text before they arrive. They walk the car, photograph every panel with you, and drive it to the workshop.",
  },
  {
    n: "03",
    t: "The mechanic rings you before starting",
    d: "They talk you through what your car needs, in their own words. You say yes, they get to work, and your driver brings it home.",
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
    d: "A text at every step, from the moment your slot is confirmed to your car back in your hands. No wondering, no chasing.",
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-page">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-line/60 bg-page/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="flex items-center gap-1.5">
            <Link
              href="/login"
              className="rounded-full px-3.5 py-2 text-sm text-muted transition hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/book"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
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
              <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-brand">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                Now serving Parramatta &amp; nearby
              </span>

              <h1 className="display mt-6 text-[3.1rem] leading-[0.94] sm:text-7xl lg:text-[5.2rem]">
                Your car goes
                <br />
                to the mechanic.
                <br />
                <span className="text-brand">You don&rsquo;t.</span>
              </h1>

              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted sm:text-lg">
                We collect your car from home or the office, take it to a
                trusted local workshop, and have it back to you before the day
                is out. You don&rsquo;t go anywhere.
              </p>

              <div className="mt-8 max-w-md">
                <SuburbCheck />
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-[13px] text-muted">
                {[
                  "Two-minute booking",
                  "Insured drivers",
                  "Cancel any time",
                ].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <span className="text-brand">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hero photo with the coverage note sitting over it */}
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
                <div className="absolute inset-0 bg-gradient-to-t from-page via-page/10 to-transparent" />
              </div>

              <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-line bg-surface/95 p-4 backdrop-blur-xl sm:left-6 sm:right-6">
                <p className="text-[13px] leading-relaxed text-ink">
                  Collecting from{" "}
                  <strong className="font-semibold">
                    {SUBURB_COUNT} suburbs
                  </strong>{" "}
                  across the Parramatta region.{" "}
                  <a
                    href="#coverage"
                    className="text-brand underline underline-offset-4"
                  >
                    See the list
                  </a>
                </p>
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
                  <span className="text-brand">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Coverage ───────────────────────────────────────────── */}
      <section id="coverage" className="scroll-mt-20 px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16">
          <div>
            <span className="eyebrow text-brand">Where we collect from</span>
            <h2 className="display mt-3 text-[2.4rem] leading-[1.02] sm:text-5xl">
              {SUBURB_COUNT} suburbs
              <br />
              around Parramatta.
            </h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted">
              Here they are — no guessing. Hover any suburb to find it on the
              map. We keep the area tight on purpose: a short run to the
              workshop is what lets us collect after nine and get your car back
              to you the same day.
            </p>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              Not on the list? Search your suburb anyway — we&rsquo;re choosing
              where to go next based on who asks.
            </p>
          </div>

          <div className="mt-10 lg:mt-0">
            <CoverageMap />
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <span className="eyebrow text-brand">How it works</span>
          <h2 className="display mt-3 max-w-2xl text-[2.4rem] leading-[1.02] sm:text-5xl">
            Gone after nine, back before five. No day off work.
          </h2>

          <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <div className="display text-[3.5rem] leading-none text-brand/25">
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
            <span className="eyebrow text-brand">No surprises</span>
            <h2 className="display mt-3 text-[2.4rem] leading-[1.02] sm:text-5xl">
              Your mechanic rings you.
              <br />
              <span className="text-brand">Every single time.</span>
            </h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted">
              No app notifications to decipher, no quote screen to tap through.
              The mechanic working on your car picks up the phone and talks you
              through it — before they start, and again if they find anything
              else along the way.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                "A call before any work begins, even a routine service",
                "Another call if they find something unexpected",
                "You talk to the person actually doing the work",
                "Nothing goes ahead until you've said yes on the phone",
              ].map((x) => (
                <li key={x} className="flex gap-3 text-[15px] text-ink">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {x}
                </li>
              ))}
            </ul>
          </div>

          {/* What the call actually sounds like — deliberately not an app screen */}
          <div className="mt-12 lg:mt-0">
            <div className="mx-auto max-w-md rounded-[1.75rem] border border-line bg-page p-7 card-shadow">
              <span className="eyebrow text-muted">
                Roughly how the call goes
              </span>

              <blockquote className="display mt-5 text-[1.35rem] leading-snug">
                &ldquo;G&rsquo;day, it&rsquo;s Sam at the workshop. Your CX-5 is
                up on the hoist — the logbook service is straightforward, but
                your front pads are down to about 3mm. Happy for me to sort
                those while it&rsquo;s here, or would you rather leave it for
                now?&rdquo;
              </blockquote>

              <p className="mt-5 border-t border-line pt-5 text-[15px] leading-relaxed text-muted">
                A two-minute conversation with the person holding the spanner.
                You ask what you want, you decide, and you settle up with the
                workshop by card the same way you would if you&rsquo;d driven
                in yourself.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ───────────────────────────────────────────── */}
      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <span className="eyebrow text-brand">What you can book it in for</span>
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
                className="group rounded-2xl border border-line bg-surface/40 p-5 transition hover:border-brand/40 hover:bg-surface"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="display text-[17px] leading-snug">{s.label}</h3>
                  {s.sameDay && (
                    <span className="eyebrow mt-0.5 shrink-0 rounded-full bg-brand/12 px-2 py-1 text-[9px] text-brand">
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
              <span className="eyebrow text-brand">
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
                <div className="rounded-2xl border border-brand/30 bg-brand/[0.06] p-5">
                  <p className="eyebrow text-brand">Gone after nine, back before five</p>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-ink">
                    Logbook service, oil, tyres, brakes, battery and pink slips.
                    Routine work, same-day return.
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-page p-5">
                  <p className="eyebrow text-muted">Needs a look first</p>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-ink">
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
          <span className="eyebrow text-brand">Handing over your keys</span>
          <h2 className="display mt-3 max-w-2xl text-[2.4rem] leading-[1.02] sm:text-5xl">
            We know exactly how big a deal this is.
          </h2>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[1.5rem] border border-line bg-line sm:grid-cols-2">
            {TRUST.map((x) => (
              <div key={x.t} className="bg-page p-7">
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
          <span className="eyebrow text-brand">Questions</span>
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
            around a <span className="text-brand">service booking.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[17px] text-muted">
            Check your postcode. If we&rsquo;re on your street, you can book a
            pickup in about two minutes.
          </p>
          <div className="mx-auto mt-9 max-w-md">
            <SuburbCheck />
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
                Car service pickup and return around Parramatta, for people
                whose time is worth more than a waiting room.
              </p>
            </div>
            <nav className="flex flex-col gap-2.5 text-[14px] text-muted">
              <Link href="/book" className="transition hover:text-ink">
                Book a pickup
              </Link>
              <a
                href="mailto:hello@tooeasy.com.au"
                className="transition hover:text-ink"
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
