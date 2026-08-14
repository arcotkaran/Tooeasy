"use client";

import { useState } from "react";

const ITEMS = [
  {
    q: "Who actually drives my car?",
    a: "A background-checked, insured Too Easy driver — the same small team every time, not a rotating gig pool. We check driving records, not just criminal records. Your car is covered while it's in our hands, and we photograph it before we pull out of your driveway.",
  },
  {
    q: "How do you get my keys?",
    a: "However you want. Hand them over at the door, leave them somewhere you tell us about, or use your building's lockbox or valet. You'll get a text with your driver's name and photo before they arrive.",
  },
  {
    q: "Will I get my car back the same day?",
    a: "For routine work — oil, tires, brakes, battery, inspection — almost always. For anything that needs diagnosis first, the shop tells us the real timeline once they've looked, and we tell you before a single bolt is turned. We'd rather give you a date we can keep.",
  },
  {
    q: "What if the shop finds something else wrong?",
    a: "You get the estimate on your phone, itemised, before any extra work starts. Approve it, decline it, or approve part of it. Nothing gets done that you didn't tap 'approve' on. That's the whole point.",
  },
  {
    q: "Is the pickup really free?",
    a: "Yes. You pay the shop's normal price for the work — nothing is marked up for you. Pickup and return costs you nothing.",
  },
  {
    q: "What does the repair cost?",
    a: "Whatever the shop quotes, which you see and approve before work begins. We don't add a fee on top, and we don't take a cut of parts or labour that changes your price.",
  },
  {
    q: "Can I do this from work instead of home?",
    a: "Yes — pickup and drop-off can be different addresses, as long as both are in the service area. Plenty of people send the car off from the office driveway.",
  },
  {
    q: "What if I need to cancel?",
    a: "Cancel any time before the driver leaves for you, free, from your booking page. No card is charged to book in the first place.",
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
