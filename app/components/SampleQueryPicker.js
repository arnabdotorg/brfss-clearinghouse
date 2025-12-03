"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function SampleQueryPicker({ samples = [], selectedId = "", onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return samples;
    return samples.filter(
      (s) =>
        s.label.toLowerCase().includes(term) ||
        s.prompt.toLowerCase().includes(term)
    );
  }, [samples, search]);

  const selected = samples.find((s) => s.id === selectedId);

  const handleSelect = (id) => {
    onSelect?.(id);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-stone-900 shadow-sm transition hover:border-amber-400"
      >
        <span className="truncate">
          {selected ? selected.label : "Choose a sample query..."}
        </span>
        <span className="text-xs text-stone-500">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-amber-200 bg-white p-3 text-sm text-stone-900 shadow-lg shadow-amber-100/80">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search samples..."
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
          />
          <div className="mt-2 max-h-60 divide-y divide-amber-100 overflow-auto rounded-lg border border-amber-100">
            {filtered.length ? (
              filtered.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelect(sample.id)}
                  className="flex w-full flex-col items-start gap-0.5 bg-white px-3 py-2 text-left hover:bg-amber-50"
                >
                  <span className="font-semibold">{sample.label}</span>
                  <span className="text-xs text-stone-600 line-clamp-2">
                    {sample.prompt}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-rose-600">
                No samples match that search.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
