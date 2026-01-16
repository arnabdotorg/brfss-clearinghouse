"use client";

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
    throw new Error("Cerebras API key is required.");
  }

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

  const systemInstruction = `You are an expert DuckDB SQL data analyst.
  
  Rules:
  1. Return only executable DuckDB SQL.
  2. No markdown formatting (no \`\`\`sql blocks).
  3. No explanations or commentary.
  4. Use ONLY the columns listed in the attached data dictionaries. Do NOT invent column names.
  5. Pay close attention to leading underscores (e.g., _SMOKER3, _BMI5). These are calculated variables and are very common. Check for them specifically.
  6. ALWAYS match a table to its same-year dictionary (e.g., brfss_2019 uses the 2019 dict).
  7. If a column is ambiguous, pick the best match from the correct year's dictionary.
  
  Available tables: ${availableTables}`;

  const userContext = `
  Attached dictionaries: ${dictParts.length ? dictPayloads.filter(Boolean).map((d) => d.year).join(", ") : "none"
    }
  
  Context Data Dictionaries:
  ${dictParts.join("\n\n")}

  User Request: ${prompt}
  `;

  try {
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-oss-120b",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userContext },
        ],
        max_completion_tokens: 32768,
        temperature: 0.01,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Cerebras API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Clean up any potential markdown if the model disobeys (though we told it not to)
    return content.replace(/```sql/gi, "").replace(/```/g, "").trim();

  } catch (err) {
    console.error("Cerebras request failed:", err);
    throw new Error(err.message || "Cerebras request failed.");
  }
}
