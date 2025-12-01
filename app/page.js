"use client";

import { useEffect, useRef, useState } from "react";
import {
  initDuckDB,
  loadCsv,
  runDuckQuery,
} from "./lib/duckdbClient";
import { checkInfoFilesPresence, generateSqlAndExplanation } from "./lib/geminiClient";
import NavTabs from "./components/NavTabs";

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const INFO_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022];

export default function Home() {
  const [status, setStatus] = useState("Loading DuckDB in your browser...");
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState(
    "Write a query that profiles the dataset and returns key stats."
  );
  const [sql, setSql] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [aiResult, setAiResult] = useState({ sql: "", explanation: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tableMeta, setTableMeta] = useState({});
  const [previewRows, setPreviewRows] = useState([]);
  const [previewColumns, setPreviewColumns] = useState([]);
  const [previewYear, setPreviewYear] = useState(null);
  const [uploadingYear, setUploadingYear] = useState(null);
  const [running, setRunning] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [infoFilesStatus, setInfoFilesStatus] = useState({});
  const [infoFilesMessage, setInfoFilesMessage] = useState(
    "Add your Gemini API key to check context files."
  );
  const [infoFilesChecking, setInfoFilesChecking] = useState(false);
  const [infoFilesError, setInfoFilesError] = useState("");

  const dbRef = useRef(null);
  const connRef = useRef(null);
  const workerUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const bootDuckDB = async () => {
      try {
        const { db, conn, workerUrl } = await initDuckDB(setStatus);
        if (cancelled) return;
        workerUrlRef.current = workerUrl;
        dbRef.current = db;
        connRef.current = conn;
        setDbReady(true);
      } catch (err) {
        console.error(err);
        setError("DuckDB failed to start in this browser.");
        setStatus("DuckDB could not start.");
      }
    };

    bootDuckDB();

    return () => {
      cancelled = true;
      connRef.current?.close();
      dbRef.current?.terminate?.();
      if (workerUrlRef.current) {
        URL.revokeObjectURL(workerUrlRef.current);
      }
    };
  }, []);

  const handleYearFileChange = async (year, event) => {
    const file = event.target.files?.[0];
    if (!file || !connRef.current || !dbRef.current) {
      setError("DuckDB is not ready yet.");
      return;
    }

    setUploadingYear(year);
    setError("");
    setMessage("");
    setAiResult({ sql: "", explanation: "" });

    try {
      const { preview } = await loadCsv(dbRef.current, connRef.current, file, year);
      setTableMeta((prev) => ({ ...prev, [year]: { name: file.name, size: file.size } }));
      setPreviewRows(preview);
      setPreviewColumns(preview.length ? Object.keys(preview[0]) : []);
      setPreviewYear(year);
      setSql(`SELECT * FROM brfss_${year} LIMIT 25;`);
      setMessage(`Loaded ${file.name} into brfss_${year}.`);
    } catch (err) {
      console.error(err);
      setError("Could not load that CSV. Try a smaller file or UTF-8 encoding.");
    } finally {
      setUploadingYear(null);
    }
  };

  const loadedYears = Object.keys(tableMeta)
    .map((year) => Number(year))
    .sort((a, b) => a - b);
  const hasApiKey = apiKey.trim().length > 0;
  const fetchGeminiSample = async () => {
    if (!connRef.current) return [];
    try {
      if (loadedYears.length) {
        const fallbackYear = loadedYears[0];
        const result = await runDuckQuery(
          connRef.current,
          `SELECT * FROM brfss_${fallbackYear} LIMIT 6;`
        );
        return result.rows;
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  useEffect(() => {
    let cancelled = false;
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setInfoFilesStatus({});
      setInfoFilesMessage("Add your Gemini API key to check context files.");
      setInfoFilesError("");
      setInfoFilesChecking(false);
      return;
    }

    setInfoFilesChecking(true);
    setInfoFilesMessage("Checking Gemini context files...");
    setInfoFilesError("");

    const timer = setTimeout(async () => {
      try {
        const { statuses, foundYears } = await checkInfoFilesPresence({
          apiKey: trimmedKey,
          years: INFO_YEARS,
        });
        if (cancelled) return;
        setInfoFilesStatus(statuses);
        setInfoFilesMessage(
          `Gemini files: ${foundYears.length}/${INFO_YEARS.length} found`
        );
      } catch (err) {
        if (cancelled) return;
        setInfoFilesStatus({});
        setInfoFilesError(err.message || "Gemini files check failed.");
        setInfoFilesMessage("Gemini files check failed.");
      } finally {
        if (!cancelled) {
          setInfoFilesChecking(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [apiKey]);

  const runQuery = async () => {
    if (!connRef.current) {
      setError("DuckDB has not finished loading yet.");
      return;
    }
    if (!sql.trim()) {
      setError("Add a SQL statement first.");
      return;
    }

    setRunning(true);
    setError("");
    setMessage("");
    setQueryResult(null);

    try {
      const result = await runDuckQuery(connRef.current, sql);
      setQueryResult(result);
      setMessage(
        `Query returned ${result.rows.length} row${
          result.rows.length === 1 ? "" : "s"
        }.`
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Query failed.");
    } finally {
      setRunning(false);
    }
  };

  const generateSql = async () => {
    if (!apiKey.trim()) {
      setError("Add your Gemini API key to draft SQL.");
      return;
    }

    setGeminiLoading(true);
    setError("");
    setMessage("");

    try {
      const sampleRows = await fetchGeminiSample();
      const result = await generateSqlAndExplanation({
        apiKey,
        prompt,
        sampleRows,
        loadedYears,
      });

      setAiResult(result);
      setMessage("Gemini drafted a query. Review and send it to the editor.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Gemini request failed.");
    } finally {
      setGeminiLoading(false);
    }
  };

  useEffect(() => {
    const loadPreviewForFirstTable = async () => {
      if (!connRef.current) return;
      if (!loadedYears.length) {
        setPreviewRows([]);
        setPreviewColumns([]);
        setPreviewYear(null);
        return;
      }
      try {
        const year = loadedYears[0];
        const result = await runDuckQuery(
          connRef.current,
          `SELECT * FROM brfss_${year} LIMIT 6;`
        );
        setPreviewRows(result.rows);
        setPreviewColumns(result.columns);
        setPreviewYear(year);
      } catch (err) {
        console.error(err);
      }
    };

    loadPreviewForFirstTable();
  }, [JSON.stringify(loadedYears)]);

  const formatBytes = (bytes) => {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );
    const value = bytes / 1024 ** exponent;
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 text-stone-900">
      <main className="mx-auto flex flex-col gap-8 py-12 px-6">
        <NavTabs />
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-700">
              Ohio BRFSS
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-stone-900">
              SQL Explorer
            </h1>
          </div>
          <div className="rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm text-stone-800 shadow-lg">
            {status}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <aside className="space-y-4">
            <div className="mt-3 space-y-2 rounded-xl bg-white/70 p-4">
              <label className="text-sm text-stone-600">
                Gemini API key 
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your key — kept in this browser only"
                className="w-full rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
              />
              <p className="text-xs text-stone-500">
                The key never leaves your machine; it is sent directly to Google from your browser.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white/80 p-5 shadow-lg shadow-amber-100/60">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Data</p>
                  <h3 className="text-lg font-semibold text-stone-900">BRFSS CSVs</h3>
                </div>
                <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
                  {loadedYears.length ? `${loadedYears.length} loaded` : "Waiting"}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-600">Upload one file per year. Each becomes brfss_YEAR in DuckDB.</p>
              <div className="mt-4 rounded-xl border border-dashed border-amber-300/70 bg-amber-50 px-3 py-3">
                <div className="space-y-2">
                  {YEARS.map((year) => (
                    <div
                      key={year}
                      className="flex flex-col gap-2 rounded-lg bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                          {year}
                        </div>
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={(e) => handleYearFileChange(year, e)}
                          className="w-full cursor-pointer text-xs text-stone-700 file:mr-2 file:rounded-lg file:border-0 file:bg-amber-600 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white sm:w-56"
                          disabled={!dbReady || uploadingYear === year}
                        />
                      </div>
                      <p className="text-[11px] text-stone-600 sm:text-right">
                        {tableMeta[year]
                          ? `${tableMeta[year].name} (${formatBytes(tableMeta[year].size)})`
                          : "Creates table brfss_" + year}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs text-stone-500">
                Union tables for cross-year analyses; add a survey_year column in your SQL.
              </p>
            </div>
          </aside>
          

          <div className="rounded-2xl border border-amber-200 bg-white/80 p-5 shadow-lg shadow-amber-100/60">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">Dataset</h3>
              <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
                {loadedYears.length ? `${loadedYears.length} loaded` : "Waiting"}
              </span>
            </div>
            <div className="mt-3 space-y-4 text-sm text-stone-800">
              <div className="rounded-xl border border-amber-100 bg-white/60 px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Gemini context files</p>
                  <span
                    className={`text-xs ${
                      infoFilesError ? "text-rose-600" : "text-stone-500"
                    }`}
                  >
                    {infoFilesChecking ? "Checking..." : infoFilesMessage}
                  </span>
                </div>
                <ul className="mt-2 space-y-2">
                  {INFO_YEARS.map((year) => {
                    const status = infoFilesStatus[year];
                    let pillLabel = "Awaiting key";
                    let pillClass = "bg-stone-100 text-stone-700";

                    if (infoFilesChecking) {
                      pillLabel = "Checking...";
                      pillClass = "bg-amber-100 text-amber-800";
                    } else if (infoFilesError) {
                      pillLabel = "Error";
                      pillClass = "bg-rose-100 text-rose-700";
                    } else if (status) {
                      pillLabel = "Found";
                      pillClass = "bg-emerald-100 text-emerald-800";
                    } else if (hasApiKey) {
                      pillLabel = "Missing";
                      pillClass = "bg-stone-200 text-stone-800";
                    }

                    return (
                      <li
                        key={year}
                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            {year}-info
                          </div>
                          <p className="text-xs text-stone-600">
                            Checked via Gemini Files API
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${pillClass}`}
                        >
                          {pillLabel}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {infoFilesError && (
                  <p className="mt-2 text-xs text-rose-600">{infoFilesError}</p>
                )}
              </div>
              <div>
                <p className="font-semibold">Loaded tables</p>
                {loadedYears.length ? (
                  <ul className="mt-2 space-y-2">
                    {loadedYears.map((year) => (
                      <li
                        key={year}
                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                      >
                        <div>
                          <p className="font-semibold text-stone-900">brfss_{year}</p>
                          <p className="text-xs text-stone-600">
                            {tableMeta[year]?.name} · {formatBytes(tableMeta[year]?.size)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-stone-600">
                    Upload CSVs to materialize them into DuckDB. Query each table directly,
                    or UNION them in your SQL for cross-year analysis.
                  </p>
                )}
              </div>
            </div>
            {previewRows.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-white/90">
                {previewYear && (
                  <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-amber-800">
                    Preview from brfss_{previewYear}
                  </p>
                )}
                <div className="w-full overflow-auto">
                  <table className="min-w-full text-xs text-stone-800">
                    <thead className="bg-amber-100 text-left font-semibold uppercase tracking-wide text-amber-800">
                      <tr>
                        {previewColumns.map((col) => (
                          <th key={col} className="px-3 py-2">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-amber-50" : ""}>
                          {previewColumns.map((col) => (
                            <td key={`${idx}-${col}`} className="px-3 py-2">
                              {String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-5 shadow-lg shadow-amber-100/60">
              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-3 rounded-xl border border-amber-200 bg-white/80 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-stone-900">
                      Ask Gemini for SQL
                    </h3>
                    <span className="text-[10px] uppercase tracking-wide text-amber-700">
                      Assistant
                    </span>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={8}
                    className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                    placeholder="Ask for a query, a summary, or a chart-ready dataset..."
                  />
                  <button
                    onClick={generateSql}
                    disabled={geminiLoading}
                    className="flex w-full items-center justify-center rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-200 disabled:text-stone-500"
                  >
                    {geminiLoading ? "Calling Gemini..." : "Draft SQL with Gemini"}
                  </button>
                  <p className="text-xs text-stone-500">
                    Gemini sees only sample rows from your loaded/selected years to propose a query.
                  </p>
                </div>
                <div className="space-y-4 rounded-xl border border-amber-200 bg-white/80 p-4 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
                        AI result
                      </p>
                      <h3 className="text-lg font-semibold text-stone-900">
                        Gemini proposal
                      </h3>
                    </div>
                    <button
                      onClick={() => setSql(aiResult.sql)}
                      disabled={!aiResult.sql}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-amber-200 disabled:text-stone-500"
                    >
                      Copy to editor
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-amber-700">
                      SQL
                    </label>
                    <textarea
                      value={aiResult.sql || "Ask Gemini to draft a query."}
                      readOnly
                      rows={8}
                      className="w-full rounded-xl border border-amber-200 bg-stone-100 px-4 py-3 font-mono text-sm text-stone-900 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
                      Explanation
                    </p>
                    <p className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-stone-800">
                      {aiResult.explanation || "Gemini will summarize the query here."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-5 shadow-lg shadow-amber-100/60">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
                    SQL editor
                  </p>
                  <h3 className="text-lg font-semibold text-stone-900">
                    DuckDB-ready statement
                  </h3>
                </div>
                <button
                  onClick={runQuery}
                  disabled={running}
                  className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
                >
                  {running ? "Running..." : "Run query"}
                </button>
              </div>
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                rows={12}
                className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 font-mono text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                placeholder="SELECT * FROM brfss_2016 LIMIT 25;"
              />
              <div className="mt-2 space-y-1 text-xs text-stone-600">
                <p>Each year is its own table (e.g., brfss_2019).</p>
                <p>
                  Need ideas? Try: COUNT rows by state, compute averages, or build a chart-ready time series with LIMIT 200. For cross-year analyses, UNION ALL tables and add a survey_year column.
                </p>
              </div>
            </div>
          </div>

        <div className="grid rounded-2xl border border-amber-200 bg-white/80 p-5 shadow-lg shadow-amber-100/60">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900">Query result</h3>
            {message && <p className="text-xs text-amber-700">{message}</p>}
            {error && (
              <p className="text-xs text-rose-600">
                {error}
              </p>
            )}
          </div>
          {!queryResult && (
            <p className="mt-3 text-sm text-stone-600">
              Run a query to see results. Need help? Ask Gemini to draft one using the prompt on the left.
            </p>
          )}
          {queryResult && queryResult.rows.length === 0 && (
            <p className="mt-3 text-sm text-stone-600">
              Query returned zero rows. Adjust your filters and try again.
            </p>
          )}
          {queryResult && queryResult.rows.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border border-amber-200 bg-white/90">
              <div className="w-full max-w-full max-h-96 overflow-auto">
                <table className="min-w-max text-sm text-stone-800">
                  <thead className="bg-amber-100 text-left font-semibold uppercase tracking-wide text-xs text-amber-800">
                    <tr>
                      {queryResult.columns.map((col) => (
                        <th key={col} className="px-4 py-3">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-amber-50" : ""}
                      >
                        {queryResult.columns.map((col) => (
                          <td
                            key={`${idx}-${col}`}
                            className="whitespace-nowrap px-4 py-2 text-stone-800"
                          >
                            {String(row[col] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
