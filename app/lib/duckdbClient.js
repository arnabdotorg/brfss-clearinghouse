"use client";

import * as duckdb from "@duckdb/duckdb-wasm";

export const TABLE_PREFIX = "brfss_";

export const toObjects = (table) => {
  const rows = table.toArray();
  return rows.map((row) =>
    typeof row.toJSON === "function" ? row.toJSON() : row
  );
};

export async function initDuckDB(onStatus) {
  onStatus?.("Downloading DuckDB bundle...");
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: "application/javascript",
    })
  );
  const worker = new Worker(workerUrl);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  const conn = await db.connect();
  onStatus?.("DuckDB ready. Upload a CSV to explore.");
  return { db, conn, workerUrl };
}

export async function loadCsv(db, conn, file, year) {
  const tableName = `${TABLE_PREFIX}${year}`;
  const buffer = new Uint8Array(await file.arrayBuffer());
  await db.registerFileBuffer(`${tableName}.csv`, buffer);
  await conn.query(`DROP TABLE IF EXISTS ${tableName};`);
  await conn.query(
    `CREATE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${tableName}.csv');`
  );
  const previewResult = await conn.query(
    `SELECT * FROM ${tableName} LIMIT 8;`
  );
  return { preview: toObjects(previewResult), tableName };
}

export async function runDuckQuery(conn, sql) {
  const result = await conn.query(sql);
  const rows = toObjects(result);
  const columns = result.schema.fields.map((field) => field.name);
  return { columns, rows };
}
