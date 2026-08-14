import { TRACKER_STEPS, statusStep, customerStatus } from "@/lib/status";

export function Tracker({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-2xl border border-line bg-surface/50 p-5">
        <p className="display text-lg">This booking was cancelled.</p>
        <p className="mt-1.5 text-[14px] text-muted">
          Nothing further will happen. Book again whenever you&rsquo;re ready.
        </p>
      </div>
    );
  }

  const current = statusStep(status);

  return (
    <div className="rounded-2xl border border-line bg-surface/40 p-5">
      <p className="eyebrow text-acid">{customerStatus(status)}</p>

      <ol className="mt-5 space-y-0">
        {TRACKER_STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const last = i === TRACKER_STEPS.length - 1;

          return (
            <li key={label} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition ${
                    done
                      ? "border-acid bg-acid text-black"
                      : active
                        ? "border-acid text-acid"
                        : "border-line text-transparent"
                  }`}
                >
                  {done ? "✓" : active ? "●" : "·"}
                </span>
                {!last && (
                  <span
                    className={`w-px flex-1 ${done ? "bg-acid/50" : "bg-line"}`}
                    style={{ minHeight: "1.75rem" }}
                  />
                )}
              </div>
              <div className={last ? "pb-0" : "pb-5"}>
                <p
                  className={`text-[15px] leading-tight ${
                    active
                      ? "font-semibold text-acid"
                      : done
                        ? "text-fg"
                        : "text-muted"
                  }`}
                >
                  {label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
