"use client";

import { useState } from "react";

const ITEMS = [
  {
    q: "Who actually drives my car?",
    a: "A licence-checked, insured Too Easy driver — the same small local team every time, not a rotating gig pool. We check driving records, not just police checks. Your car is covered while it's in our hands, and we photograph it before we pull out of your driveway.",
  },
  {
    q: "Who do I deal with about the work itself?",
    a: "The workshop, directly. They inspect your car, tell you what it needs and talk to you about it themselves. We're the booking and transport channel — we move your car and keep you posted on where it is. What gets done to it is between you and the mechanic.",
  },
  {
    q: "How do you get my keys?",
    a: "However suits you. Hand them over at the door, leave them somewhere you tell us about, or use your building's lockbox or concierge. You'll get a text with your driver's name before they arrive.",
  },
  {
    q: "Will I get my car back the same day?",
    a: "For routine work — logbook service, oil, tyres, brakes, battery, pink slip — usually yes. Anything that needs diagnosis first depends on what the workshop finds, and they'll tell you the timeline once they've looked. We'd rather give you a date we can keep.",
  },
  {
    q: "Which workshop do you take it to?",
    a: "A vetted independent workshop near Wentworthville that we work with directly. You'll know exactly where your car is going before you confirm the booking, and it's the same place every time unless you ask otherwise.",
  },
  {
    q: "Can I do this from work instead of home?",
    a: "Yes — pickup and drop-off can be different addresses, as long as both are inside our area. Plenty of people send the car off from the office car park.",
  },
  {
    q: "What if something happens to my car?",
    a: "We photograph every panel, wheel and the odometer with you at pickup, and again at drop-off, all timestamped. The car is insured for the whole time it's with us. If anything is ever disputed, the photos settle it.",
  },
  {
    q: "What if I need to cancel?",
    a: "Cancel any time before the driver sets off, from the text we send you or by replying to your confirmation email. No commitment when you book.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line border-y border-line">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-start justify-between gap-4 py-5 text-left"
            >
              <span
                className={`display text-[17px] leading-snug transition-colors ${
                  isOpen ? "text-acid" : "text-fg"
                }`}
              >
                {item.q}
              </span>
              <span
                aria-hidden
                className={`mt-1 shrink-0 text-muted transition-transform duration-300 ${
                  isOpen ? "rotate-45 text-acid" : ""
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1v14M1 8h14"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </button>
            <div
              className="grid transition-all duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="pb-6 pr-8 text-[15px] leading-relaxed text-muted">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
