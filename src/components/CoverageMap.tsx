import { WORKSHOP, coveredSuburbs } from "@/lib/geo";

/**
 * A schematic radius map rather than a street map: no API key, no external
 * request, no cookie banner, and it answers the only question a customer has
 * — "do you come to my suburb?" The list underneath is the authoritative
 * answer; the map just gives it a shape.
 */

const SIZE = 560;
const CENTRE = SIZE / 2;
const PX_PER_KM = 21;

const KM_PER_DEG_LAT = 110.9;
const KM_PER_DEG_LNG = 111.32 * Math.cos((WORKSHOP.lat * Math.PI) / 180);

function project(lat: number, lng: number) {
  return {
    x: CENTRE + (lng - WORKSHOP.lng) * KM_PER_DEG_LNG * PX_PER_KM,
    y: CENTRE - (lat - WORKSHOP.lat) * KM_PER_DEG_LAT * PX_PER_KM,
  };
}

export function CoverageMap() {
  const suburbs = coveredSuburbs();

  // Place labels left or right of each dot, then nudge apart anything that
  // would collide vertically. Crude, but it keeps 21 labels readable.
  const placed: { x: number; y: number; ly: number; anchor: "start" | "end"; s: (typeof suburbs)[number] }[] = [];
  for (const s of suburbs) {
    const { x, y } = project(s.lat, s.lng);
    const anchor: "start" | "end" = x >= CENTRE ? "start" : "end";
    let ly = y + 3.5;
    let guard = 0;
    while (
      guard++ < 40 &&
      placed.some(
        (p) => p.anchor === anchor && Math.abs(p.ly - ly) < 13 && Math.abs(p.x - x) < 120,
      )
    ) {
      ly += 13;
    }
    placed.push({ x, y, ly, anchor, s });
  }

  return (
    <div>
      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface p-3">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Map of the ${WORKSHOP.radius_km} kilometre pickup area around Wentworthville, covering ${suburbs
            .map((s) => s.name)
            .join(", ")}.`}
        >
          {/* distance rings */}
          {[5, 10].map((km) => (
            <circle
              key={km}
              cx={CENTRE}
              cy={CENTRE}
              r={km * PX_PER_KM}
              fill={km === 10 ? "var(--color-brand)" : "none"}
              fillOpacity={km === 10 ? 0.06 : 0}
              stroke="var(--color-brand)"
              strokeOpacity={km === 10 ? 0.5 : 0.22}
              strokeWidth={km === 10 ? 2 : 1}
              strokeDasharray={km === 10 ? undefined : "4 5"}
            />
          ))}

          <text
            x={CENTRE}
            y={CENTRE - 10 * PX_PER_KM - 8}
            textAnchor="middle"
            fill="var(--color-brand)"
            fontSize="12"
            fontWeight="600"
          >
            {WORKSHOP.radius_km} km
          </text>

          {placed.map(({ x, y, ly, anchor, s }) => {
            const isHub = s.km === 0;
            return (
              <g key={s.postcode}>
                <line
                  x1={x}
                  y1={y}
                  x2={anchor === "start" ? x + 7 : x - 7}
                  y2={ly - 3.5}
                  stroke="var(--color-line)"
                  strokeWidth="1"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={isHub ? 6 : 4}
                  fill={isHub ? "var(--color-brand)" : "var(--color-surface)"}
                  stroke="var(--color-brand)"
                  strokeWidth={isHub ? 3 : 2}
                />
                <text
                  x={anchor === "start" ? x + 10 : x - 10}
                  y={ly}
                  textAnchor={anchor}
                  fontSize="12"
                  fontWeight={isHub ? 700 : 500}
                  fill={isHub ? "var(--color-brand)" : "var(--color-ink)"}
                >
                  {s.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* The list is the real answer — the map is the illustration. */}
      <ul className="mt-6 flex flex-wrap gap-2">
        {suburbs.map((s) => (
          <li
            key={s.postcode}
            className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[14px]"
          >
            {s.name}{" "}
            <span className="text-muted tabular-nums">{s.postcode}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
