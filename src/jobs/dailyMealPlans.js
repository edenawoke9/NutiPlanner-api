const prisma = require("../prisma");
const { regenerateMealPlanForUser } = require("../services/mealPlanning/mealPlanService");
const { startOfDay } = require("../services/mealPlanning/weeklyFoodLimit");

async function runDailyMealPlans() {
  const today = startOfDay(new Date());
  const users = await prisma.user.findMany({
    where: { userInfo: { isNot: null } },
    select: { userId: true, username: true },
  });

  const results = { date: today.toISOString().slice(0, 10), ok: 0, failed: 0, errors: [] };

  for (const user of users) {
    try {
      const result = await regenerateMealPlanForUser({
        userId: user.userId,
        planDate: today,
        generatedBy: "stochastic-cron",
      });

      if (result.ok) {
        results.ok += 1;
      } else {
        results.failed += 1;
        results.errors.push({
          userId: user.userId,
          username: user.username,
          message: result.message,
        });
      }
    } catch (error) {
      results.failed += 1;
      results.errors.push({
        userId: user.userId,
        username: user.username,
        message: error.message || String(error),
      });
    }
  }

  console.log(
    `[dailyMealPlans] ${results.date}: ${results.ok} ok, ${results.failed} failed (${users.length} users)`
  );
  if (results.errors.length) {
    console.error("[dailyMealPlans] errors:", results.errors);
  }

  return results;
}

module.exports = { runDailyMealPlans };
