"use client";

import { useState } from "react";
import Papa from "papaparse";
import PivotTableUI from "react-pivottable/PivotTableUI";
import "react-pivottable/pivottable.css";
import NavTabs from "../components/NavTabs";

export default function PivotPage() {
  const [data, setData] = useState([]);
  const [pivotState, setPivotState] = useState({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Upload a CSV to start.");
  const [rowCount, setRowCount] = useState(0);

  const handleFile = (file) => {
    setError("");
    if (!file) {
      setStatus("Upload a CSV to start.");
      setRowCount(0);
      setData([]);
      setPivotState({});
      return;
    }

    setStatus("Reading CSV...");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        const rows = results?.data || [];
        if (!rows.length) {
          setError("CSV had no rows.");
          setStatus("Upload a CSV to start.");
          setData([]);
          setPivotState({});
          setRowCount(0);
          return;
        }
        setData(rows);
        setPivotState((prev) => ({ ...prev, data: rows }));
        setRowCount(rows.length);
        setStatus(`Loaded ${rows.length.toLocaleString()} rows. Drag fields to pivot.`);
      },
      error: (err) => {
        console.error(err);
        setError("Could not parse that CSV.");
        setStatus("Upload a CSV to start.");
        setData([]);
        setPivotState({});
        setRowCount(0);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 text-stone-900">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 py-10 px-6">
        <NavTabs />
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Ohio BRFSS</p>
            <h1 className="text-3xl font-semibold leading-tight text-stone-900">Pivot</h1>
            <p className="text-sm text-stone-600">
              Upload a CSV and explore it with react-pivottable directly in your browser.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-amber-500">
              Upload CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
              />
            </label>
            <span className="rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-xs font-semibold text-stone-700 shadow">
              {status}
            </span>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-lg shadow-amber-100/60">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900">Pivot</h3>
            <p className="text-xs text-stone-600">
              Drag fields between rows/columns; aggregators and renderers are built-in.
            </p>
          </div>
          <div className="min-h-[420px] overflow-auto rounded-xl border border-amber-100 bg-white p-3">
            {rowCount ? (
              <PivotTableUI
                data={data}
                onChange={(s) => setPivotState(s)}
                {...pivotState}
              />
            ) : (
              <p className="text-sm text-stone-500">
                Upload a CSV to start. All processing stays in your browser.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
