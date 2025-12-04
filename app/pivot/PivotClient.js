// app/pivot/PivotClient.js
"use client";

import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import PivotTableUI from "react-pivottable/PivotTableUI";
import "react-pivottable/pivottable.css";
import NavTabs from "../components/NavTabs";

const DATA_DICT_URLS = {
  2016: new URL("../datadicts/2016_datadict.csv", import.meta.url).href,
  2017: new URL("../datadicts/2017_datadict.csv", import.meta.url).href,
  2018: new URL("../datadicts/2018_datadict.csv", import.meta.url).href,
  2019: new URL("../datadicts/2019_datadict.csv", import.meta.url).href,
  2020: new URL("../datadicts/2020_datadict.csv", import.meta.url).href,
  2021: new URL("../datadicts/2021_datadict.csv", import.meta.url).href,
  2022: new URL("../datadicts/2022_datadict.csv", import.meta.url).href,
  2023: new URL("../datadicts/2023_datadict.csv", import.meta.url).href,
  union: new URL("../datadicts/union_datadict.csv", import.meta.url).href,
};

const parseDictText = (text) => {
  // The union dictionary has malformed quotes; parse by splitting on the first comma per line.
  const lines = text.split(/\r?\n/);
  const rows = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || idx === 0) return; // skip header/empty
    const commaIdx = trimmed.indexOf(",");
    if (commaIdx === -1) return;
    const column_name = trimmed.slice(0, commaIdx).trim();
    const rawDesc = trimmed.slice(commaIdx + 1).trim();
    const description = rawDesc.replace(/^"+|"+$/g, "");
    rows.push({
      column_name,
      description,
      column_type: "",
      possible_values: "",
    });
  });
  return rows;
};

export default function PivotClient() {
  const [data, setData] = useState([]);
  const [pivotState, setPivotState] = useState({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Upload a CSV to start.");
  const [rowCount, setRowCount] = useState(0);

  const [dictSearch, setDictSearch] = useState("");
  const [dictResults, setDictResults] = useState([]);
  const [dictError, setDictError] = useState("");
  const [dictLoading, setDictLoading] = useState(false);
  const dictCacheRef = useRef(new Map());

  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [columnSearch, setColumnSearch] = useState("");

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
        const columns = results?.meta?.fields || Object.keys(rows[0] || {});
        if (!rows.length || !columns.length) {
          setError("CSV had no rows.");
          setStatus("Upload a CSV to start.");
          setData([]);
          setPivotState({});
          setRowCount(0);
          return;
        }
        setAvailableColumns(columns);
        setSelectedColumns([]);
        setShowColumnPicker(true);
        setData(rows);
        setPivotState({});
        setRowCount(rows.length);
        setStatus(
          `Loaded ${rows.length.toLocaleString()} rows. Choose columns to include.`
        );
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = sessionStorage.getItem("pivotTransfer");
    if (!payload) return;
    sessionStorage.removeItem("pivotTransfer");
    try {
      const { rows = [], columns = [] } = JSON.parse(payload);
      if (!rows.length) return;
      setData(rows);
      const cols = columns.length ? columns : Object.keys(rows[0] || {});
      setSelectedColumns([]);
      setAvailableColumns(cols);
      setPivotState((prev) => ({ ...prev, data: rows }));
      setRowCount(rows.length);
      setStatus(
        "Loaded from SQL Explorer. Drag fields to pivot or reopen column selector."
      );
    } catch (err) {
      console.error("Pivot transfer parse error:", err);
    }
  }, []);

  const lookupDict = async () => {
    setDictError("");
    setDictResults([]);
    const term = dictSearch.trim().toLowerCase();
    if (!term) {
      setDictError("Enter a variable name or description to search.");
      return;
    }

    setDictLoading(true);
    try {
      // load all dicts into cache if not present
      const entries = [];
      for (const key of Object.keys(DATA_DICT_URLS)) {
        let parsed = dictCacheRef.current.get(key);
        if (!parsed) {
          const res = await fetch(DATA_DICT_URLS[key]);
          if (!res.ok) throw new Error(`Could not load data dictionary: ${key}`);
          const text = await res.text();
          parsed = parseDictText(text);
          dictCacheRef.current.set(key, parsed);
        }
        parsed.forEach((row) => {
          entries.push({
            table: key,
            column_name: row.column_name || "",
            description: row.description || "",
            column_type: row.column_type || "",
            possible_values: row.possible_values || "",
          });
        });
      }

      const filtered = entries.filter((entry) => {
        const name = entry.column_name.toLowerCase();
        const desc = entry.description.toLowerCase();
        return name.includes(term) || desc.includes(term);
      });

      if (filtered.length) {
        setDictResults(filtered);
      } else {
        setDictError("No matches found across dictionaries.");
      }
    } catch (err) {
      console.error(err);
      setDictError(err.message || "Lookup failed.");
    } finally {
      setDictLoading(false);
    }
  };

  const applyColumnSelection = () => {
    const trimmed = selectedColumns.filter(Boolean);
    const filteredData = data.map((row) => {
      const next = {};
      trimmed.forEach((col) => {
        next[col] = row[col];
      });
      return next;
    });
    setPivotState((prev) => ({ ...prev, data: filteredData }));
    setShowColumnPicker(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 text-stone-900">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 py-10 px-6">
        <NavTabs />
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-amber-700">
              Ohio BRFSS
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-stone-900">
              Pivot
            </h1>
            <p className="text-sm text-stone-600">
              Upload a CSV and explore it with react-pivottable directly in your
              browser.
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

        <section className="rounded-2xl border border-amber-200 bg-white/80 p-4 shadow-lg shadow-amber-100/60">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
                Data dictionary lookup
              </p>
              <h3 className="text-lg font-semibold text-stone-900">
                Search all dictionaries
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end w-full">
              <div className="flex w-full flex-col gap-1">
                <label className="text-xs text-stone-600">
                  Name or description
                </label>
                <input
                  value={dictSearch}
                  onChange={(e) => setDictSearch(e.target.value)}
                  placeholder="e.g., head injury, OH8_1"
                  className="w-full sm:w-[28rem] rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") lookupDict();
                  }}
                />
              </div>
              <button
                onClick={lookupDict}
                disabled={dictLoading}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-200 disabled:text-stone-500"
              >
                {dictLoading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
          {dictError && (
            <p className="mt-2 text-sm text-rose-700">{dictError}</p>
          )}
          {dictResults.length > 0 && (
            <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-amber-200 bg-white">
              <table className="min-w-full text-sm text-stone-800">
                <thead className="bg-amber-100 text-xs font-semibold uppercase tracking-wide text-amber-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Table</th>
                    <th className="px-3 py-2 text-left">Variable</th>
                    <th className="px-3 py-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {dictResults.map((res, idx) => (
                    <tr
                      key={`${res.table}-${res.column_name}-${idx}`}
                      className={
                        idx % 2 === 0 ? "bg-white" : "bg-amber-50"
                      }
                    >
                      <td className="px-3 py-2 text-xs font-semibold text-amber-800">
                        {res.table === "union" ? "Union" : res.table}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-stone-900">
                        {res.column_name}
                      </td>
                      <td className="px-3 py-2 text-xs text-stone-700">
                        {res.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-lg shadow-amber-100/60">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900">Pivot</h3>
            <p className="text-xs text-stone-600">
              Drag fields between rows/columns; aggregators and renderers are
              built-in.
            </p>
            {rowCount > 0 && (
              <button
                onClick={() => setShowColumnPicker(true)}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                Choose columns
              </button>
            )}
          </div>
          <div className="min-h-[420px] overflow-auto rounded-xl border border-amber-100 bg-white p-3">
            {rowCount ? (
              <PivotTableUI
                data={pivotState.data || data}
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

        {showColumnPicker && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-900/40 px-4">
            <div className="w-full max-w-2xl rounded-2xl border border-amber-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
                    Column selection
                  </p>
                  <h3 className="text-lg font-semibold text-stone-900">
                    Choose fields for the pivot
                  </h3>
                  <p className="text-sm text-stone-600">
                    Select the columns to include. You can open this dialog
                    again after uploading.
                  </p>
                </div>
                <button
                  onClick={() => setShowColumnPicker(false)}
                  className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-amber-50"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value)}
                  placeholder="Search columns..."
                  className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                />
                <button
                  onClick={() => setSelectedColumns(availableColumns)}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  Select all
                </button>
                <button
                  onClick={() => setSelectedColumns([])}
                  className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                >
                  Deselect all
                </button>
                <button
                  onClick={applyColumnSelection}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500"
                >
                  Apply
                </button>
              </div>
              <div className="mt-4 max-h-80 overflow-auto rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableColumns
                    .filter((col) =>
                      col
                        .toLowerCase()
                        .includes(columnSearch.trim().toLowerCase())
                    )
                    .map((col) => {
                      const checked = selectedColumns.includes(col);
                      return (
                        <label
                          key={col}
                          className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-stone-800 shadow-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedColumns((prev) =>
                                  prev.includes(col) ? prev : [...prev, col]
                                );
                              } else {
                                setSelectedColumns((prev) =>
                                  prev.filter((c) => c !== col)
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-amber-300 text-amber-600"
                          />
                          <span className="truncate" title={col}>
                            {col}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
