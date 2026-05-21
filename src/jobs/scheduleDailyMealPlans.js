const cron = require("node-cron");
const { runDailyMealPlans } = require("./dailyMealPlans");

const CRON_EXPRESSION = process.env.MEAL_PLAN_CRON || "0 5 * * *";
const TIMEZONE = process.env.MEAL_PLAN_CRON_TZ || undefined;

function startDailyMealPlanCron() {
  if (process.env.ENABLE_DAILY_MEAL_PLAN_CRON === "false") {
    console.log("[dailyMealPlans] cron disabled (ENABLE_DAILY_MEAL_PLAN_CRON=false)");
    return null;
  }

  const task = cron.schedule(
    CRON_EXPRESSION,
    async () => {
      try {
        await runDailyMealPlans();
      } catch (error) {
        console.error("[dailyMealPlans] cron run failed:", error);
      }
    },
    {
      scheduled: true,
      timezone: TIMEZONE,
    }
  );

  const tzLabel = TIMEZONE || "server local time";
  console.log(`[dailyMealPlans] scheduled at "${CRON_EXPRESSION}" (${tzLabel})`);
  return task;
}

module.exports = { startDailyMealPlanCron, runDailyMealPlans };
