#!/usr/bin/env node
require("dotenv").config({ path: process.env.PHORVA_ENV_FILE || ".env.production.local" });
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error("Missing database URL. Run `vercel env pull .env.production.local` first.");
  process.exit(1);
}

const sourcePath = path.resolve(
  process.argv[2] || path.join(__dirname, "..", "data", "phorva.json")
);
const replaceExisting = process.argv.includes("--replace");

function normalize(data) {
  const keys = [
    "developers",
    "sessions",
    "projects",
    "apiKeys",
    "agents",
    "passwordResetTokens",
    "executionRecords",
    "securityAlerts"
  ];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Source JSON must contain a database object.");
  }
  const output = {};
  for (const key of keys) {
    if (data[key] !== undefined && !Array.isArray(data[key])) {
      throw new Error(`Invalid source data: ${key} must be an array.`);
    }
    output[key] = Array.isArray(data[key]) ? data[key] : [];
  }
  return output;
}

async function main() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source database file not found: ${sourcePath}`);
  }
  const raw = fs.readFileSync(sourcePath, "utf8");
  const data = normalize(JSON.parse(raw));
  const summary = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value.length])
  );
  console.log("Source database record counts:", JSON.stringify(summary));

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined
  });

  const client = await pool.connect();
  try {
    await client.query("CREATE SCHEMA IF NOT EXISTS phorva");
    await client.query(`
      CREATE TABLE IF NOT EXISTS phorva.app_state (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await client.query("BEGIN");
    const current = await client.query(
      "SELECT id FROM phorva.app_state WHERE id = 1 FOR UPDATE"
    );
    if (current.rows.length && !replaceExisting) {
      throw new Error(
        "A Phorva state row already exists. Nothing was changed. Inspect the existing row first; use --replace only if you intentionally want to overwrite it."
      );
    }

    if (replaceExisting) {
      await client.query(
        "INSERT INTO phorva.app_state (id, data, updated_at) VALUES (1, $1::jsonb, now()) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()",
        [JSON.stringify(data)]
      );
    } else {
      await client.query(
        "INSERT INTO phorva.app_state (id, data, updated_at) VALUES (1, $1::jsonb, now())",
        [JSON.stringify(data)]
      );
    }
    await client.query("COMMIT");
    console.log("Phorva JSON data imported successfully into phorva.app_state.");
    console.log("No data was overwritten unless --replace was explicitly supplied.");
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Phorva data import failed:", error.message);
  process.exitCode = 1;
});
