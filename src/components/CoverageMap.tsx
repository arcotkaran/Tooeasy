"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, CircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { coveredSuburbs, SERVICE_CENTRE, type Suburb } from "@/lib/geo";

/**
 * A real street map with a marker per serviced suburb. Hovering either the
 * map or the suburb list highlights the same suburb in both, so the list and
 * the map read as one thing.
 *
 * Leaflet is loaded on the client only — the site is a static export.
 */
export function CoverageMap() {
  const suburbs = useMemo(() => coveredSuburbs(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<string, CircleMarker>>({});
  const [active, setActive] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const key = (s: Suburb) => `${s.name}-${s.postcode}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [SERVICE_CENTRE.lat, SERVICE_CENTRE.lng],
        zoom: 12,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
      ).addTo(map);

      const bounds = L.latLngBounds([]);

      for (const s of suburbs) {
        const marker = L.circleMarker([s.lat, s.lng], {
          radius: 7,
          color: "#c4522f",
          weight: 2,
          fillColor: "#ffffff",
          fillOpacity: 1,
        }).addTo(map);

        marker.bindTooltip(`${s.name} ${s.postcode}`, {
          direction: "top",
          offset: [0, -6],
        });

        marker.on("mouseover", () => setActive(key(s)));
        marker.on("mouseout", () => setActive(null));

        markersRef.current[key(s)] = marker;
        bounds.extend([s.lat, s.lng]);
      }

      map.fitBounds(bounds, { padding: [30, 30] });
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [suburbs]);

  // Keep the map markers in step with whichever chip is hovered.
  useEffect(() => {
    for (const [k, marker] of Object.entries(markersRef.current)) {
      const on = k === active;
      marker.setStyle({
        radius: on ? 11 : 7,
        fillColor: on ? "#c4522f" : "#ffffff",
        weight: on ? 3 : 2,
      });
      if (on) marker.bringToFront();
    }
  }, [active]);

  function focus(s: Suburb) {
    setActive(key(s));
    const marker = markersRef.current[key(s)];
    if (marker && mapRef.current) {
      mapRef.current.panTo([s.lat, s.lng], { animate: true });
      marker.openTooltip();
    }
  }

  return (
    <div>
      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface">
        <div
          ref={containerRef}
          className="h-[340px] w-full sm:h-[420px]"
          aria-label={`Map showing the suburbs we collect from: ${suburbs
            .map((s) => s.name)
            .join(", ")}.`}
        />
        {!ready && (
          <div className="px-5 py-3 text-[13px] text-muted">Loading map…</div>
        )}
      </div>

      <ul className="mt-5 flex flex-wrap gap-2">
        {suburbs.map((s) => {
          const k = key(s);
          const on = active === k;
          return (
            <li key={k}>
              <button
                type="button"
                onMouseEnter={() => focus(s)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => focus(s)}
                onBlur={() => setActive(null)}
                className={`rounded-full border px-3.5 py-1.5 text-[14px] transition ${
                  on
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-surface text-ink hover:border-brand/50"
                }`}
              >
                {s.name}{" "}
                <span
                  className={`tabular-nums ${on ? "text-white/75" : "text-muted"}`}
                >
                  {s.postcode}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
