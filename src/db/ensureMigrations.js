const { execSync } = require("child_process");
const path = require("path");
const prisma = require("../prisma");

const DEBUG_ENDPOINT =
  "http://127.0.0.1:7747/ingest/2d44f485-f941-440b-956a-846c1c74f62c";
const SESSION_ID = "6c9c86";
const PROJECT_ROOT = path.join(__dirname, "../..");

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

function runPrismaCommand(command) {
  return execSync(command, {
    cwd: PROJECT_ROOT,
    stdio: "pipe",
    env: process.env,
  });
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

async function foodItemTableExists() {
  const rows = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'FoodItem'
  `;
  return Array.isArray(rows) && rows.length > 0;
}

/** Idempotent schema patch — does not depend on Prisma migration history. */
async function ensureCategoryColumn() {
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "FoodItem" ADD COLUMN IF NOT EXISTS "category" VARCHAR(50);'
  );
}

function tryMigrateDeploy() {
  try {
    runPrismaCommand("npx prisma migrate deploy");
    return { ok: true };
  } catch (err) {
    const stderr = err?.stderr?.toString?.() || "";
    const stdout = err?.stdout?.toString?.() || "";
    return { ok: false, stderr, stdout, message: err?.message };
  }
}

async function tryRecoverFailedMigrations() {
  const hasFoodItem = await foodItemTableExists();
  if (!hasFoodItem) {
    return { recovered: false, reason: "FoodItem table missing" };
  }

  try {
    runPrismaCommand('npx prisma migrate resolve --applied "20260308204551_init"');
    const deploy = tryMigrateDeploy();
    return { recovered: deploy.ok, deploy };
  } catch (err) {
    return {
      recovered: false,
      reason: err?.message?.slice(0, 200),
      stderr: err?.stderr?.toString?.().slice(0, 300),
    };
  }
}

async function ensureMigrations() {
  const dbHost = dbHostFromUrl();

  // #region agent log
  debugLog({
    hypothesisId: "F",
    location: "src/db/ensureMigrations.js:ensureMigrations:entry",
    message: "ensureMigrations started",
    data: { dbHost, nodeEnv: process.env.NODE_ENV || null },
    runId: "post-fix",
  });
  // #endregion

  let hadCategoryBefore = false;
  try {
    hadCategoryBefore = await checkCategoryColumn();
    // #region agent log
    debugLog({
      hypothesisId: "A",
      location: "src/db/ensureMigrations.js:checkCategoryColumn:before",
      message: "category column check before patch",
      data: { hadCategoryBefore, dbHost },
      runId: "post-fix",
    });
    // #endregion
  } catch (err) {
    // #region agent log
    debugLog({
      hypothesisId: "A",
      location: "src/db/ensureMigrations.js:checkCategoryColumn:error",
      message: "category column check failed",
      data: { message: err?.message?.slice(0, 200) },
      runId: "post-fix",
    });
    // #endregion
  }

  if (!hadCategoryBefore) {
    try {
      await ensureCategoryColumn();
      // #region agent log
      debugLog({
        hypothesisId: "A",
        location: "src/db/ensureMigrations.js:ensureCategoryColumn",
        message: "applied raw SQL category column patch",
        data: { dbHost },
        runId: "post-fix",
      });
      // #endregion
    } catch (err) {
      // #region agent log
      debugLog({
        hypothesisId: "A",
        location: "src/db/ensureMigrations.js:ensureCategoryColumn:error",
        message: "raw SQL category patch failed",
        data: { message: err?.message?.slice(0, 200) },
        runId: "post-fix",
      });
      // #endregion
      throw err;
    }
  }

  const deployResult = tryMigrateDeploy();
  // #region agent log
  debugLog({
    hypothesisId: "B",
    location: "src/db/ensureMigrations.js:migrateDeploy",
    message: deployResult.ok ? "migrate deploy ok" : "migrate deploy failed",
    data: {
      ok: deployResult.ok,
      stderr: deployResult.stderr?.slice(0, 300),
      stdout: deployResult.stdout?.slice(0, 200),
    },
    runId: "post-fix",
  });
  // #endregion

  if (!deployResult.ok && deployResult.stderr?.includes("P3009")) {
    const recovery = await tryRecoverFailedMigrations();
    // #region agent log
    debugLog({
      hypothesisId: "F",
      location: "src/db/ensureMigrations.js:p3009Recovery",
      message: "attempted P3009 migration recovery",
      data: recovery,
      runId: "post-fix",
    });
    // #endregion
    if (!recovery.recovered) {
      console.warn(
        "[ensureMigrations] Prisma migrate deploy blocked (P3009); category column patched via SQL. Manual resolve may be needed."
      );
    }
  } else if (!deployResult.ok) {
    console.warn(
      "[ensureMigrations] prisma migrate deploy failed (non-fatal):",
      deployResult.stderr?.slice(0, 200) || deployResult.message
    );
  }

  const hasCategoryAfter = await checkCategoryColumn();
  // #region agent log
  debugLog({
    hypothesisId: "A",
    location: "src/db/ensureMigrations.js:checkCategoryColumn:after",
    message: "category column check after patch",
    data: { hadCategoryBefore, hasCategoryAfter, dbHost },
    runId: "post-fix",
  });
  // #endregion

  if (!hasCategoryAfter) {
    throw new Error("FoodItem.category column missing after schema patch");
  }
}

module.exports = { ensureMigrations, checkCategoryColumn, ensureCategoryColumn };
