"use client";

import { GoogleGenAI, createUserContent } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash";

const safeStringify = (value) =>
  JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v));

const DATA_DICT_URLS = {
  2016: new URL("../datadicts/2016_datadict.csv", import.meta.url).href,
  2017: new URL("../datadicts/2017_datadict.csv", import.meta.url).href,
  2018: new URL("../datadicts/2018_datadict.csv", import.meta.url).href,
  2019: new URL("../datadicts/2019_datadict.csv", import.meta.url).href,
  2020: new URL("../datadicts/2020_datadict.csv", import.meta.url).href,
  2021: new URL("../datadicts/2021_datadict.csv", import.meta.url).href,
  2022: new URL("../datadicts/2022_datadict.csv", import.meta.url).href,
  2023: new URL("../datadicts/2023_datadict.csv", import.meta.url).href,
};

const dataDictCache = new Map();

async function fetchDataDict(year) {
  if (dataDictCache.has(year)) {
    return dataDictCache.get(year);
  }

  const url = DATA_DICT_URLS[year];
  if (!url) {
    dataDictCache.set(year, null);
    return null;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load datadict for ${year}`);
    }
    const text = await res.text();
    dataDictCache.set(year, text);
    console.log(text);
    return text;
  } catch (err) {
    console.error(`Data dictionary load failed for ${year}:`, err);
    dataDictCache.set(year, null);
    return null;
  }
}

export async function draftSql({
  apiKey,
  prompt,
  loadedYears = [],
  sampleRows = [],
}) {
  if (!apiKey) {
    throw new Error("Gemini API key is required.");
  }

  const genAI = new GoogleGenAI({ apiKey });
  const availableTables = loadedYears.length
    ? loadedYears.map((year) => `brfss_${year}`).join(", ")
    : "None";

  const dictPayloads = await Promise.all(
    loadedYears.map(async (year) => {
      const text = await fetchDataDict(year);
      if (!text) return null;
      return {
        year,
        text,
      };
    })
  );

  const dictParts = dictPayloads
    .filter(Boolean)
    .map(
      ({ year, text }) =>
        `DATA DICTIONARY — YEAR ${year} — TABLE brfss_${year}\nColumns: column_name, column_type, description, possible_values (Python dict-style)\n${text}`
    );

  const instruction = `You are a DuckDB SQL assistant. Return only executable DuckDB SQL with no markdown or commentary. Use the attached BRFSS data dictionaries for column names, descriptions, allowed values, and DuckDB types. ALWAYS match a table to its same-year dictionary (brfss_2019 uses the 2019 dictionary, etc.). If querying multiple years, reference each table with its matching year dictionary. If a column is ambiguous, pick the best match from the correct year dictionary and sample rows.

Available tables: ${availableTables}
Attached dictionaries: ${
    dictParts.length ? dictPayloads.filter(Boolean).map((d) => d.year).join(", ") : "none"
  }

User request: ${prompt}

Return only SQL. Do not wrap in fences or add prefixes.`;

  let result;
  console.log(dictParts);
  try {
    result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: createUserContent([...dictParts, instruction]),
    });
  } catch (err) {
    const message = err?.message || "Gemini request failed.";
    throw new Error(message);
  }

  const raw = result?.text || "";
  if (!raw.trim()) {
    throw new Error("Gemini did not return SQL.");
  }

  return raw.replace(/```sql/gi, "").replace(/```/g, "").trim();
}
