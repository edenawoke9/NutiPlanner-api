const { execSync } = require("child_process");
const path = require("path");
const prisma = require("../prisma");

const DEBUG_ENDPOINT =
  "http://127.0.0.1:7747/ingest/2d44f485-f941-440b-956a-846c1c74f62c";
const SESSION_ID = "6c9c86";

function debugLog(payload) {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      timestamp: Date.now(),
      ...payload,
    }),
  }).catch(() => {});
  // #endregion
}

function dbHostFromUrl() {
  try {
    const u = new URL(process.env.DATABASE_URL || "");
    return u.hostname || "unknown";
  } catch {
    return "invalid-url";
  }
}

async function checkCategoryColumn() {
  const rows = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'FoodItem'
      AND column_name = 'category'
  `;
  return Array.isArray(rows) && rows.length > 0;
}

async function ensureMigrations() {
  const dbHost = dbHostFromUrl();
  const startCommand = process.env.RENDER_START_COMMAND || process.env.npm_lifecycle_event || null;

  // #region agent log
  debugLog({
    hypothesisId: "B",
    location: "src/db/ensureMigrations.js:ensureMigrations:entry",
    message: "ensureMigrations started",
    data: { dbHost, startCommand, nodeEnv: process.env.NODE_ENV || null },
    runId: "pre-fix",
  });
  // #endregion

  let hadCategoryBefore = false;
  try {
    hadCategoryBefore = await checkCategoryColumn();
    // #region agent log
    debugLog({
      hypothesisId: "A",
      location: "src/db/ensureMigrations.js:checkCategoryColumn:before",
      message: "category column check before migrate",
      data: { hadCategoryBefore, dbHost },
      runId: "pre-fix",
    });
    // #endregion
  } catch (err) {
    // #region agent log
    debugLog({
      hypothesisId: "A",
      location: "src/db/ensureMigrations.js:checkCategoryColumn:error",
      message: "category column check failed",
      data: { code: err?.code, message: err?.message?.slice(0, 200) },
      runId: "pre-fix",
    });
    // #endregion
  }

  if (!hadCategoryBefore) {
    try {
      execSync("npx prisma migrate deploy", {
        cwd: path.join(__dirname, "../.."),
        stdio: "pipe",
        env: process.env,
      });
      // #region agent log
      debugLog({
        hypothesisId: "B",
        location: "src/db/ensureMigrations.js:migrateDeploy",
        message: "prisma migrate deploy completed",
        data: { dbHost },
        runId: "pre-fix",
      });
      // #endregion
    } catch (err) {
      const stderr = err?.stderr?.toString?.() || "";
      // #region agent log
      debugLog({
        hypothesisId: "B",
        location: "src/db/ensureMigrations.js:migrateDeploy:error",
        message: "prisma migrate deploy failed",
        data: { message: err?.message?.slice(0, 200), stderr: stderr.slice(0, 300) },
        runId: "pre-fix",
      });
      // #endregion
      throw err;
    }
  }

  const hasCategoryAfter = await checkCategoryColumn();
  // #region agent log
  debugLog({
    hypothesisId: "A",
    location: "src/db/ensureMigrations.js:checkCategoryColumn:after",
    message: "category column check after migrate",
    data: { hadCategoryBefore, hasCategoryAfter, dbHost },
    runId: "pre-fix",
  });
  // #endregion

  if (!hasCategoryAfter) {
    throw new Error("FoodItem.category column missing after migrate deploy");
  }
}

module.exports = { ensureMigrations, checkCategoryColumn };
