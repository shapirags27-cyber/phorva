const fs = require("fs");
const path = require("path");
const { AsyncLocalStorage } = require("async_hooks");
const { Pool } = require("pg");

const dataDir =
  process.env.PHORVA_DATA_DIR ||
  path.join(__dirname, "..", "data");

const dataPath =
  process.env.PHORVA_DATABASE_PATH ||
  path.join(dataDir, "phorva.json");

const requestStorage = new AsyncLocalStorage();
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;

let pool;
if (connectionString) {
  pool = new Pool({
    connectionString,
    max: Number(process.env.PHORVA_DB_POOL_SIZE || 2),
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined
  });

  pool.on("error", (error) => {
    console.error("Phorva PostgreSQL pool error:", error.message);
  });
}

function emptyDatabase() {
  return {
    developers: [],
    sessions: [],
    projects: [],
    apiKeys: [],
    agents: [],
    passwordResetTokens: [],
    executionRecords: [],
    securityAlerts: []
  };
}

function normalizeDatabase(data) {
  const normalized = emptyDatabase();
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return normalized;
  }
  for (const key of Object.keys(normalized)) {
    normalized[key] = Array.isArray(data[key]) ? data[key] : [];
  }
  return normalized;
}

// The local JSON backend is retained for tests and local development. Vercel
// requests use a PostgreSQL transaction held for the lifetime of each request.
function ensureLocalFile() {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify(emptyDatabase(), null, 2), {
      mode: 0o600
    });
  }
}

function load() {
  const context = requestStorage.getStore();
  if (context && context.data) return context.data;

  ensureLocalFile();
  try {
    const raw = fs.readFileSync(dataPath, "utf8");
    if (!raw.trim()) return emptyDatabase();
    return normalizeDatabase(JSON.parse(raw));
  } catch (error) {
    throw new Error(`Failed to read Phorva database: ${error.message}`);
  }
}

function save(data) {
  const context = requestStorage.getStore();
  if (context && context.data) {
    context.data = normalizeDatabase(data);
    return;
  }

  ensureLocalFile();
  const tempPath = `${dataPath}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), { mode: 0o600 });
    fs.chmodSync(tempPath, 0o600);
    fs.renameSync(tempPath, dataPath);
  } catch (error) {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {}
    throw new Error(`Failed to write Phorva database: ${error.message}`);
  }
}

function withData(callback) {
  const data = load();
  const result = callback(data);
  const context = requestStorage.getStore();
  if (context && context.data) {
    context.data = data;
  } else {
    save(data);
  }
  return result;
}

function getDataPath() {
  return dataPath;
}

async function beginPostgresRequest() {
  if (!pool) throw new Error("PostgreSQL is not configured: set DATABASE_URL.");
  const client = await pool.connect();
  let clientError = null;
  const onClientError = (error) => {
    clientError = error;
    console.error("Phorva PostgreSQL client error:", error.message);
  };
  client.on("error", onClientError);

  try {
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT data FROM phorva.app_state WHERE id = 1 FOR UPDATE"
    );
    if (!result.rows.length) {
      throw new Error(
        "Phorva database is not initialized. Import the existing data into phorva.app_state before serving production traffic."
      );
    }
    return {
      client,
      clientError,
      data: normalizeDatabase(result.rows[0].data),
      finished: false
    };
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    client.release(clientError || undefined);
    throw error;
  }
}

async function finishPostgresRequest(context) {
  if (!context || context.finished) return;
  context.finished = true;
  try {
    await context.client.query(
      "UPDATE phorva.app_state SET data = $1::jsonb, updated_at = now() WHERE id = 1",
      [JSON.stringify(normalizeDatabase(context.data))]
    );
    await context.client.query("COMMIT");
  } catch (error) {
    try { await context.client.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    context.client.release(context.clientError || undefined);
  }
}

function middleware() {
  return async function phorvaPostgresRequest(req, res, next) {
    // Static assets and preflight requests do not need a database transaction.
    if (
      req.method === "OPTIONS" ||
      req.path === "/health" ||
      req.path === "/api/health" ||
      req.path === "/" ||
      /\.[a-z0-9]{1,8}$/i.test(req.path)
    ) {
      return next();
    }

    // Local tests and local development keep the JSON-file backend.
    if (!pool) return next();

    let context;
    try {
      context = await beginPostgresRequest();
    } catch (error) {
      console.error("Phorva database request could not start:", error.message);
      return res.status(503).json({
        error: "Phorva database unavailable",
        code: "DATABASE_UNAVAILABLE"
      });
    }

    requestStorage.run(context, () => {
      const originalEnd = res.end;
      let ending = false;
      res.end = function (...args) {
        if (ending) return res;
        ending = true;
        finishPostgresRequest(context).then(() => {
          originalEnd.apply(res, args);
        }).catch((error) => {
          console.error("Phorva database commit failed:", error.message);
          if (!res.headersSent) {
            res.statusCode = 503;
            res.removeHeader("Content-Length");
            res.removeHeader("ETag");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            originalEnd.call(res, JSON.stringify({
              error: "Phorva could not persist the request",
              code: "DATABASE_COMMIT_FAILED"
            }));
          } else {
            originalEnd.apply(res, args);
          }
        });
        return res;
      };
      next();
    });
  };
}

async function closePool() {
  if (pool) await pool.end();
}

module.exports = {
  load,
  save,
  withData,
  getDataPath,
  middleware,
  closePool,
  emptyDatabase,
  normalizeDatabase
};
