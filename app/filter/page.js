"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NavTabs from "../components/NavTabs";
import { initDuckDB, loadCsv, runDuckQuery, TABLE_PREFIX } from "../lib/duckdbClient";

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const ENABLED_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022];

const checkboxGroups = {
  gender: {
    label: "Gender",
    column: "SEX",
    options: [
      { label: "Male", value: 1 },
      { label: "Female", value: 2 },
    ],
    defaultValue: [1, 2],
  },
  maritalStatus: {
    label: "Marital Status",
    column: "MARITAL",
    options: [
      { label: "Married", value: 1 },
      { label: "Divorced", value: 2 },
      { label: "Widowed", value: 3 },
      { label: "Separated", value: 4 },
      { label: "Never Married", value: 5 },
      { label: "Member of Unmarried Couple", value: 6 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 3, 4, 5, 6, 9],
  },
  educationLevel: {
    label: "Education Level",
    column: "EDUCA",
    options: [
      { label: "Never Attended/Only Kindergarten", value: 1 },
      { label: "Grades 1-8", value: 2 },
      { label: "Grades 9-11", value: 3 },
      { label: "Grade 12 or GED", value: 4 },
      { label: "College 1-3 Years", value: 5 },
      { label: "College >=4 Years", value: 6 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 3, 4, 5, 6, 9],
  },
  persHealthProv: {
    label: "Have Personal Healthcare Provider",
    column: "PERSDOC2",
    options: [
      { label: "Yes, only one", value: 1 },
      { label: "More than one", value: 2 },
      { label: "No", value: 3 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 3, 7, 9],
  },
  primSourceIns: {
    label: "Primary Source of Insurance",
    column: null,
    options: [
      { label: "Employer/Union", value: 1 },
      { label: "Private", value: 2 },
      { label: "Medicare", value: 3 },
      { label: "Medigap", value: 4 },
      { label: "Medicaid", value: 5 },
      { label: "CHIP", value: 6 },
      { label: "Military", value: 7 },
      { label: "Indian Health Service", value: 8 },
      { label: "State-sponsored", value: 9 },
      { label: "Other Government program", value: 10 },
      { label: "No Coverage", value: 88 },
      { label: "Don't Know/Not Sure", value: 77 },
      { label: "Refused", value: 99 },
    ],
    defaultValue: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 88, 77, 99],
  },
  cantAffordDoctor: {
    label: "Could Not Afford to See Doctor",
    column: "MEDCOST",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  lengthSinceLastCheckup: {
    label: "Length of Time Since Last Checkup",
    column: "CHECKUP1",
    options: [
      { label: "Within Past Year", value: 1 },
      { label: "Within Past 2 Years", value: 2 },
      { label: "Within Past 5 Years", value: 3 },
      { label: "5 or More Years", value: 4 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Never", value: 8 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 3, 4, 7, 8, 9],
  },
  heartAttack: {
    label: "Heart Attack",
    column: "CVDINFR4",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  anginaOrCoronary: {
    label: "Angina/Coronary Heart Disease",
    column: "CVDCRHD4",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  stroke: {
    label: "Stroke",
    column: "CVDSTRK3",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  asthma: {
    label: "Asthma",
    column: "ASTHMA3",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  skinCancer: {
    label: "Skin Cancer (Excluding Melanoma)",
    column: "CHCSCNCR",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  otherCancer: {
    label: "Melanoma or Other Cancer",
    column: "CHCOCNCR",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  TBIq1: {
    label: "Hospitalized or treated in ER following head injury",
    column: "OH7_1",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  TBIq2: {
    label: "Head/neck injury from car accident or crash",
    column: "OH7_2",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  TBIq3: {
    label: "Head/neck injury from being hit by something or falling",
    column: "OH7_3",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  TBIq4: {
    label: "Head/neck injury from fight, hit by someone, shaken, shot",
    column: "OH7_4",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  TBIq5: {
    label: "Been near an explosion",
    column: "OH7_5",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  TBIq6: {
    label: "Knocked out or lost consciousness",
    column: "OH7_6",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  TBIq7: {
    label: "Longest time knocked out",
    column: "OH7_7",
    options: [
      { label: "Less than 5 minutes", value: 1 },
      { label: "5 to 30 minutes", value: 2 },
      { label: "30 minutes to <24 hours", value: 3 },
      { label: "24 hours or longer", value: 4 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 3, 4, 7, 9],
  },
  TBIq10: {
    label: "Dazed, confused, gap in memory",
    column: "OH7_10",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
  TBIq11: {
    label: "Multiple repeated blows",
    column: "OH7_11",
    options: [
      { label: "Yes", value: 1 },
      { label: "No", value: 2 },
      { label: "Don't Know/Not Sure", value: 7 },
      { label: "Refused", value: 9 },
    ],
    defaultValue: [1, 2, 7, 9],
  },
};

const textInputs = {
  age: {
    label: "Age",
    column: "AGE",
    helper: "Optional; leave blank to include all ages",
  },
  TBIq8: {
    label: "Age when first knocked out or lost consciousness",
    column: "OH7_8",
    helper: "Don't Know/Not Sure = 777, Refused = 999",
  },
  TBIq9: {
    label: "Age when last knocked out or lost consciousness",
    column: "OH7_9",
    helper: "Don't Know/Not Sure = 777, Refused = 999",
  },
};

const columnOverrides = {
  2017: {
    TBIq1: "OH6_1",
    TBIq2: "OH6_2",
    TBIq3: "OH6_3",
    TBIq4: "OH6_4",
    TBIq5: "OH6_5",
    TBIq6: "OH6_6",
    TBIq7: "OH6_7",
    TBIq8: "OH6_8",
    TBIq9: "OH6_9",
    TBIq10: "OH6_10",
    TBIq11: "OH6_11",
  },
  2018: {
    gender: "SEX1",
  },
  2019: {
    gender: "SEXVAR",
    primSourceIns: "HLTHCVR1",
    TBIq1: "OH5_1",
    TBIq2: "OH5_2",
    TBIq3: "OH5_3",
    TBIq4: "OH5_4",
    TBIq5: "OH5_5",
    TBIq6: "OH5_6",
    TBIq7: "OH5_7",
    TBIq8: "OH5_8",
    TBIq9: "OH5_9",
    TBIq10: "OH5_10",
    TBIq11: "OH5_11",
  },
  2020: {
    gender: "SEXVAR",
    primSourceIns: "HLTHCVR1",
    TBIq1: "OH4_1",
    TBIq2: "OH4_2",
    TBIq3: "OH4_3",
    TBIq4: "OH4_4",
    TBIq5: "OH4_5",
    TBIq6: "OH4_6",
    TBIq7: "OH4_7",
    TBIq8: "OH4_8",
    TBIq9: "OH4_9",
    TBIq10: "OH4_10",
    TBIq11: "OH4_11",
  },
  2021: {
    gender: "SEXVAR",
    primSourceIns: "PRIMINSR",
    persHealthProv: "PERSDOC3",
    cantAffordDoctor: "MEDCOST1",
  },
  2022: {
    gender: "SEXVAR",
    persHealthProv: "PERSDOC3",
    cantAffordDoctor: "MEDCOST1",
    primSourceIns: "PRIMINSR",
    skinCancer: "CHCSCNC1",
    otherCancer: "CHCOCNC1",
    TBIq1: "OH8_1",
    TBIq2: "OH8_2",
    TBIq3: "OH8_3",
    TBIq4: "OH8_4",
    TBIq5: "OH8_5",
    TBIq6: "OH8_6",
    TBIq7: "OH8_7",
    TBIq8: "OH8_8",
    TBIq9: "OH8_9",
    TBIq10: "OH8_10",
    TBIq11: "OH8_11",
  },
};

const CheckboxGroup = ({ label, options, values, onToggle }) => (
  <div className="space-y-2 rounded-xl border border-amber-200 bg-white/80 p-4">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold text-stone-900">{label}</h4>
      <button
        type="button"
        onClick={() => onToggle("reset")}
        className="text-xs font-semibold text-amber-700"
      >
        Reset
      </button>
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked = values.includes(option.value);
        return (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
              checked
                ? "border-amber-500 bg-amber-50 text-amber-800"
                : "border-amber-100 bg-white text-stone-700 hover:border-amber-200"
            }`}
          >
            <input
              type="checkbox"
              className="hidden"
              checked={checked}
              onChange={() => onToggle(option.value)}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  </div>
);

export default function FilterPage() {
  const [status, setStatus] = useState("Loading DuckDB in your browser...");
  const [dbReady, setDbReady] = useState(false);
  const [uploadingYear, setUploadingYear] = useState(null);
  const [selectedYear, setSelectedYear] = useState(ENABLED_YEARS[0]);
  const [tableMeta, setTableMeta] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewColumns, setPreviewColumns] = useState([]);
  const [running, setRunning] = useState(false);

  const dbRef = useRef(null);
  const connRef = useRef(null);
  const workerUrlRef = useRef(null);

  const [filters, setFilters] = useState(() => {
    const defaults = {};
    Object.entries(checkboxGroups).forEach(([key, config]) => {
      defaults[key] = config.defaultValue;
    });
    Object.keys(textInputs).forEach((key) => {
      defaults[key] = "";
    });
    return defaults;
  });

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

    try {
      const { preview, tableName } = await loadCsv(dbRef.current, connRef.current, file, year);
      setTableMeta((prev) => ({
        ...prev,
        [year]: { name: file.name, size: file.size, tableName },
      }));
      setPreviewRows(preview);
      setPreviewColumns(preview.length ? Object.keys(preview[0]) : []);
      setMessage(`Loaded ${file.name} into ${tableName}.`);
    } catch (err) {
      console.error(err);
      setError("Could not load that CSV. Try a smaller file or UTF-8 encoding.");
    } finally {
      setUploadingYear(null);
    }
  };

  const toggleCheckbox = (key, value) => {
    setFilters((prev) => {
      if (value === "reset") {
        return { ...prev, [key]: checkboxGroups[key].defaultValue };
      }
      const set = new Set(prev[key]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...prev, [key]: Array.from(set).sort((a, b) => a - b) };
    });
  };

  const updateText = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const columnFor = (key) => columnOverrides[selectedYear]?.[key] || checkboxGroups[key]?.column || textInputs[key]?.column;
  const primaryInsuranceColumn = columnFor("primSourceIns");

  const formatValue = (value) => {
    return `'${String(value).replace(/'/g, "''")}'`;
  };

  useEffect(() => {
    const loadPreview = async () => {
      if (!connRef.current) return;
      if (!tableMeta[selectedYear]) return;
      try {
        const result = await runDuckQuery(
          connRef.current,
          `SELECT * FROM ${TABLE_PREFIX}${selectedYear} LIMIT 6;`
        );
        setPreviewRows(result.rows);
        setPreviewColumns(result.columns);
      } catch (err) {
        console.error(err);
      }
    };

    loadPreview();
  }, [selectedYear, JSON.stringify(tableMeta)]);

  const buildQuery = useMemo(() => {
    const clauses = [];
    const addInClause = (configKey) => {
      const group = checkboxGroups[configKey];
      const values = filters[configKey];
      const column = columnFor(configKey);
      if (group && column && values?.length) {
        clauses.push(`${column} IS NULL OR ${column} IN (null, ${values.join(", ")})`);
      }
    };
    const addTextClause = (configKey) => {
      const column = columnFor(configKey);
      if (!column) return;
      const raw = filters[configKey] ?? "";
      const value = String(raw).trim();
      if (value) {
        const formatted = formatValue(value);
        clauses.push(`(${column} IS NULL OR ${column} = ${formatted} OR ${formatted} = '')`);
      } else {
        clauses.push(`${column} IS NULL OR (${column} = '' OR '' = '')`);
      }
    };

    addInClause("gender");
    addTextClause("age");
    addInClause("maritalStatus");
    addInClause("educationLevel");
    addInClause("primSourceIns");
    addInClause("persHealthProv");
    addInClause("cantAffordDoctor");
    addInClause("lengthSinceLastCheckup");
    addInClause("heartAttack");
    addInClause("anginaOrCoronary");
    addInClause("stroke");
    addInClause("asthma");
    addInClause("skinCancer");
    addInClause("otherCancer");
    addInClause("TBIq1");
    addInClause("TBIq2");
    addInClause("TBIq3");
    addInClause("TBIq4");
    addInClause("TBIq5");
    addInClause("TBIq6");
    addInClause("TBIq7");
    addTextClause("TBIq8");
    addTextClause("TBIq9");

    addInClause("TBIq10");
    addInClause("TBIq11");

    const where = clauses.length ? `\nWHERE ${clauses.join("\n  AND ")}` : "";
    return `SELECT * FROM ${TABLE_PREFIX}${selectedYear}${where}\nLIMIT 200;`;
  }, [filters, selectedYear]);

  const runFilteredQuery = async () => {
    if (!connRef.current) {
      setError("DuckDB has not finished loading yet.");
      return;
    }
    if (!tableMeta[selectedYear]) {
      setError(`Upload a CSV for ${selectedYear} to run filters.`);
      return;
    }

    setRunning(true);
    setError("");
    setMessage("");
    setQueryResult(null);

    try {
      const result = await runDuckQuery(connRef.current, buildQuery);
      setQueryResult(result);
      setMessage(`Query returned ${result.rows.length} row${
        result.rows.length === 1 ? "" : "s"
      } (limited to 200).`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Query failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 text-stone-900">
      <main className="mx-auto flex flex-col gap-8 py-12 px-6">
        <NavTabs />
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Ohio BRFSS</p>
            <h1 className="text-4xl font-semibold leading-tight text-stone-900">Filter</h1>
            <p className="text-sm text-stone-600">Upload the 2016, 2017, 2018, 2019, 2020, or 2022 CSV, pick filters, and view the rows directly in DuckDB.</p>
          </div>
          <div className="rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm text-stone-800 shadow-lg">
            {status}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          <aside className="space-y-4 rounded-2xl border border-amber-200 bg-white/80 p-4 shadow-lg shadow-amber-100/60">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Years</p>
              <h3 className="text-lg font-semibold text-stone-900">Choose dataset</h3>
              <p className="text-sm text-stone-600">2016, 2017, 2018, 2019, 2020, and 2022 are available now. Additional years are placeholders for future data.</p>
            </div>
            <div className="grid gap-2">
              {YEARS.map((year) => {
                const active = year === selectedYear;
                const enabled = ENABLED_YEARS.includes(year);
                const loaded = Boolean(tableMeta[year]);
                return (
                  <button
                    key={year}
                    onClick={() => enabled && setSelectedYear(year)}
                    disabled={!enabled}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-amber-500 bg-amber-50 text-amber-800"
                        : "border-amber-100 bg-white text-stone-700 hover:border-amber-200"
                    } ${!enabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <span>{year}</span>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      loaded ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"
                    }`}>
                      {loaded ? "Loaded" : enabled ? "Upload" : "Soon"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="space-y-3 rounded-xl border border-dashed border-amber-300/70 bg-amber-50 px-3 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-900">BRFSS {selectedYear} CSV</p>
                <span className="text-xs text-stone-600">One file</span>
              </div>
              <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-sm ${
                ENABLED_YEARS.includes(selectedYear) ? "" : "opacity-60"
              }`}>
                <span>Choose file</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => handleYearFileChange(selectedYear, e)}
                  disabled={!dbReady || uploadingYear === selectedYear || !ENABLED_YEARS.includes(selectedYear)}
                />
                <span className="rounded-full bg-amber-600 px-3 py-1 text-[11px] font-semibold text-white">
                  {uploadingYear === selectedYear ? "Loading..." : "Upload"}
                </span>
              </label>
              <p className="text-xs text-stone-600">Creates table {TABLE_PREFIX}{selectedYear} in DuckDB. File stays in the browser.</p>
              {tableMeta[selectedYear] && (
                <p className="text-xs text-emerald-700">
                  {tableMeta[selectedYear].name} · {(tableMeta[selectedYear].size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="grid gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-5 shadow-lg shadow-amber-100/60">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Filters</p>
                  <h3 className="text-lg font-semibold text-stone-900">Demographics</h3>
                </div>
                <span className="text-xs text-stone-600">Applies to table {TABLE_PREFIX}{selectedYear}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <CheckboxGroup
                  label={checkboxGroups.gender.label}
                  options={checkboxGroups.gender.options}
                  values={filters.gender}
                  onToggle={(value) => toggleCheckbox("gender", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.maritalStatus.label}
                  options={checkboxGroups.maritalStatus.options}
                  values={filters.maritalStatus}
                  onToggle={(value) => toggleCheckbox("maritalStatus", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.educationLevel.label}
                  options={checkboxGroups.educationLevel.options}
                  values={filters.educationLevel}
                  onToggle={(value) => toggleCheckbox("educationLevel", value)}
                />
                <div className="space-y-2 rounded-xl border border-amber-200 bg-white/80 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-stone-900">{textInputs.age.label}</h4>
                    <button
                      type="button"
                      onClick={() => updateText("age", "")}
                      className="text-xs font-semibold text-amber-700"
                    >
                      Clear
                    </button>
                  </div>
                  <input
                    type="text"
                    value={filters.age}
                    onChange={(e) => updateText("age", e.target.value)}
                    placeholder="Any"
                    className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                  />
                  <p className="text-xs text-stone-500">{textInputs.age.helper}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-5 shadow-lg shadow-amber-100/60">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Healthcare Access</p>
                <h3 className="text-lg font-semibold text-stone-900">Coverage & Checkups</h3>
              </div>
              <div className={`grid gap-3 ${primaryInsuranceColumn ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
                {primaryInsuranceColumn && (
                  <CheckboxGroup
                    label={checkboxGroups.primSourceIns.label}
                    options={checkboxGroups.primSourceIns.options}
                    values={filters.primSourceIns}
                    onToggle={(value) => toggleCheckbox("primSourceIns", value)}
                  />
                )}
                <CheckboxGroup
                  label={checkboxGroups.persHealthProv.label}
                  options={checkboxGroups.persHealthProv.options}
                  values={filters.persHealthProv}
                  onToggle={(value) => toggleCheckbox("persHealthProv", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.cantAffordDoctor.label}
                  options={checkboxGroups.cantAffordDoctor.options}
                  values={filters.cantAffordDoctor}
                  onToggle={(value) => toggleCheckbox("cantAffordDoctor", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.lengthSinceLastCheckup.label}
                  options={checkboxGroups.lengthSinceLastCheckup.options}
                  values={filters.lengthSinceLastCheckup}
                  onToggle={(value) => toggleCheckbox("lengthSinceLastCheckup", value)}
                />
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-5 shadow-lg shadow-amber-100/60">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Chronic Health Conditions</p>
                <h3 className="text-lg font-semibold text-stone-900">Conditions</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <CheckboxGroup
                  label={checkboxGroups.heartAttack.label}
                  options={checkboxGroups.heartAttack.options}
                  values={filters.heartAttack}
                  onToggle={(value) => toggleCheckbox("heartAttack", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.anginaOrCoronary.label}
                  options={checkboxGroups.anginaOrCoronary.options}
                  values={filters.anginaOrCoronary}
                  onToggle={(value) => toggleCheckbox("anginaOrCoronary", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.stroke.label}
                  options={checkboxGroups.stroke.options}
                  values={filters.stroke}
                  onToggle={(value) => toggleCheckbox("stroke", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.asthma.label}
                  options={checkboxGroups.asthma.options}
                  values={filters.asthma}
                  onToggle={(value) => toggleCheckbox("asthma", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.skinCancer.label}
                  options={checkboxGroups.skinCancer.options}
                  values={filters.skinCancer}
                  onToggle={(value) => toggleCheckbox("skinCancer", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.otherCancer.label}
                  options={checkboxGroups.otherCancer.options}
                  values={filters.otherCancer}
                  onToggle={(value) => toggleCheckbox("otherCancer", value)}
                />
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-5 shadow-lg shadow-amber-100/60">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-700">TBI Module</p>
                <h3 className="text-lg font-semibold text-stone-900">Injury History</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <CheckboxGroup
                  label={checkboxGroups.TBIq1.label}
                  options={checkboxGroups.TBIq1.options}
                  values={filters.TBIq1}
                  onToggle={(value) => toggleCheckbox("TBIq1", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.TBIq2.label}
                  options={checkboxGroups.TBIq2.options}
                  values={filters.TBIq2}
                  onToggle={(value) => toggleCheckbox("TBIq2", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.TBIq3.label}
                  options={checkboxGroups.TBIq3.options}
                  values={filters.TBIq3}
                  onToggle={(value) => toggleCheckbox("TBIq3", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.TBIq4.label}
                  options={checkboxGroups.TBIq4.options}
                  values={filters.TBIq4}
                  onToggle={(value) => toggleCheckbox("TBIq4", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.TBIq5.label}
                  options={checkboxGroups.TBIq5.options}
                  values={filters.TBIq5}
                  onToggle={(value) => toggleCheckbox("TBIq5", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.TBIq6.label}
                  options={checkboxGroups.TBIq6.options}
                  values={filters.TBIq6}
                  onToggle={(value) => toggleCheckbox("TBIq6", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.TBIq7.label}
                  options={checkboxGroups.TBIq7.options}
                  values={filters.TBIq7}
                  onToggle={(value) => toggleCheckbox("TBIq7", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.TBIq10.label}
                  options={checkboxGroups.TBIq10.options}
                  values={filters.TBIq10}
                  onToggle={(value) => toggleCheckbox("TBIq10", value)}
                />
                <CheckboxGroup
                  label={checkboxGroups.TBIq11.label}
                  options={checkboxGroups.TBIq11.options}
                  values={filters.TBIq11}
                  onToggle={(value) => toggleCheckbox("TBIq11", value)}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {["TBIq8", "TBIq9"].map((key) => (
                  <div key={key} className="space-y-2 rounded-xl border border-amber-200 bg-white/80 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-stone-900">{textInputs[key].label}</h4>
                      <button
                        type="button"
                        onClick={() => updateText(key, "")}
                        className="text-xs font-semibold text-amber-700"
                      >
                        Clear
                      </button>
                    </div>
                    <input
                      type="text"
                      value={filters[key]}
                      onChange={(e) => updateText(key, e.target.value)}
                      placeholder="Any"
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                    />
                    <p className="text-xs text-stone-500">{textInputs[key].helper}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-amber-200 bg-white/80 p-5 shadow-lg shadow-amber-100/60">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-700">SQL Preview</p>
                <h3 className="text-lg font-semibold text-stone-900">Generated query</h3>
                <p className="text-xs text-stone-600">Uses year-specific columns (OH7_* for 2016, OH6_* for 2017, SEX1 for 2018, OH5_* plus HLTHCVR1/SEXVAR for 2019, OH4_* plus HLTHCVR1/SEXVAR for 2020, OH8_* plus MEDCOST1/PERSDOC3/PRIMINSR for 2022).</p>
              </div>
                <button
                  onClick={runFilteredQuery}
                  disabled={running}
                  className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
                >
                  {running ? "Running..." : "Apply filters"}
                </button>
              </div>
              <pre className="w-full overflow-auto rounded-xl border border-amber-200 bg-stone-950/90 px-4 py-3 text-sm text-amber-50">{buildQuery}</pre>
              {message && <p className="text-xs text-amber-700">{message}</p>}
              {error && <p className="text-xs text-rose-600">{error}</p>}
            </div>

            <div className="grid rounded-2xl border border-amber-200 bg-white/80 p-5 shadow-lg shadow-amber-100/60">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-stone-900">Query result</h3>
                {message && <p className="text-xs text-amber-700">{message}</p>}
                {error && <p className="text-xs text-rose-600">{error}</p>}
              </div>
              {!queryResult && (
                <p className="mt-3 text-sm text-stone-600">Run a filtered query to see rows. Results are capped at 200 for faster browsing.</p>
              )}
              {queryResult && queryResult.rows.length === 0 && (
                <p className="mt-3 text-sm text-stone-600">Query returned zero rows. Adjust your selections and try again.</p>
              )}
              {queryResult && queryResult.rows.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-xl border border-amber-200 bg-white/90">
                  <div className="w-full max-w-full max-h-96 overflow-auto">
                    <table className="min-w-max text-sm text-stone-800">
                      <thead className="bg-amber-100 text-left font-semibold uppercase tracking-wide text-xs text-amber-800">
                        <tr>
                          {queryResult.columns.map((col) => (
                            <th key={col} className="px-4 py-3">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-amber-50" : ""}>
                            {queryResult.columns.map((col) => (
                              <td key={`${idx}-${col}`} className="whitespace-nowrap px-4 py-2 text-stone-800">{String(row[col] ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
