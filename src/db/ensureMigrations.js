const { execSync } = require("child_process");
const path = require("path");
const prisma = require("../prisma");

const PROJECT_ROOT = path.join(__dirname, "../..");

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
  let hadCategoryBefore = false;
  try {
    hadCategoryBefore = await checkCategoryColumn();
  } catch {
    // Non-fatal; patch below may still succeed.
  }

  if (!hadCategoryBefore) {
    await ensureCategoryColumn();
  }

  const deployResult = tryMigrateDeploy();

  if (!deployResult.ok && deployResult.stderr?.includes("P3009")) {
    const recovery = await tryRecoverFailedMigrations();
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
  if (!hasCategoryAfter) {
    throw new Error("FoodItem.category column missing after schema patch");
  }
}

module.exports = { ensureMigrations, checkCategoryColumn, ensureCategoryColumn };
