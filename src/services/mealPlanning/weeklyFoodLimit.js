const prisma = require("../../prisma");

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Foods that already appear >= maxPerWeek times in the rolling 7-day window
 * ending yesterday (today's plan is excluded — it will be replaced).
 */
async function getExcludedFoodNames(userId, planDate, maxPerWeek = 4) {
  const day = startOfDay(planDate);
  const windowStart = addDays(day, -7);

  const items = await prisma.mealPlanItem.findMany({
    where: {
      mealPlan: {
        userId,
        planDate: { gte: windowStart, lt: day },
      },
    },
    select: {
      food: { select: { foodName: true } },
    },
  });

  const counts = new Map();
  for (const item of items) {
    const name = item.food?.foodName;
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  const excluded = new Set();
  for (const [name, count] of counts) {
    if (count >= maxPerWeek) {
      excluded.add(name);
    }
  }
  return excluded;
}

module.exports = { getExcludedFoodNames, startOfDay, addDays };
