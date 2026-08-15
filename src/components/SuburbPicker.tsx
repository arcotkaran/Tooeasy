"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchSuburbs, isCovered, type Suburb } from "@/lib/geo";

/**
 * Type-ahead over suburb name and postcode. Australian postcodes cover
 * several suburbs, so typing "2145" has to offer Westmead, Wentworthville,
 * Greystanes and the rest rather than guessing one.
 */
export function SuburbPicker({
  value,
  onSelect,
  placeholder = "Start typing your suburb or postcode",
  autoFocus = false,
}: {
  value: Suburb | null;
  onSelect: (s: Suburb | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState(value ? `${value.name} ${value.postcode}` : "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const results = useMemo(() => searchSuburbs(query, 40), [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => setHighlight(0), [query]);

  function choose(s: Suburb) {
    onSelect(s);
    setQuery(`${s.name} ${s.postcode}`);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[highlight]) choose(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        autoFocus={autoFocus}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onSelect(null);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-2xl border border-line bg-surface px-4 py-4 text-ink placeholder:text-muted/70 outline-none transition focus:border-brand/60"
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-line bg-surface py-1.5 card-shadow"
        >
          {results.length === 0 && (
            <li className="px-4 py-3 text-[14px] text-muted">
              No suburb matches &ldquo;{query}&rdquo;.
            </li>
          )}
          {results.map((s, i) => {
            const covered = isCovered(s);
            return (
              <li key={`${s.name}-${s.postcode}`} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => choose(s)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition ${
                    i === highlight ? "bg-surface-2" : ""
                  }`}
                >
                  <span className="text-[15px]">
                    {s.name}{" "}
                    <span className="tabular-nums text-muted">{s.postcode}</span>
                  </span>
                  {!covered && (
                    <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
                      Not yet
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
