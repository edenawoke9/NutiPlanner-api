const prisma = require("../../prisma");
const { calculateNutritionTargets } = require("../nutritionTargetService");
const { generateStochasticMealPlan, ensureLoaded, ensureLoadedFromDbFoods } = require("./stochasticMealPlan");
const { getExcludedFoodNames, startOfDay } = require("./weeklyFoodLimit");

function sumNutrition(items) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function isWithinCalorieTolerance(calories, target, tolerancePct = 8) {
  if (!target || target <= 0) return true;
  const diffPct = (Math.abs(calories - target) / target) * 100;
  return diffPct <= tolerancePct;
}

function planItemsToDbRows(planItems, foodByName) {
  return planItems.map((item) => {
    const food = foodByName.get(item.foodName);
    if (!food) {
      throw new Error(`Matched food "${item.foodName}" not found in database. Run prisma:seed`);
    }
    if (!["breakfast", "lunch", "dinner", "snack"].includes(item.mealType)) {
      throw new Error(`Invalid mealType ${item.mealType}`);
    }

    const quantity = item.portionGrams / 100;
    return {
      mealType: item.mealType,
      foodId: food.foodId,
      quantity,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    };
  });
}

async function deleteMealPlanById(mealPlanId) {
  await prisma.mealPlanItem.deleteMany({ where: { mealPlanId } });
  await prisma.mealPlan.delete({ where: { mealPlanId } });
}

async function generateMealPlanForUser({
  userId,
  planDate,
  generatedBy = "stochastic",
  excludeFoodNames,
}) {
  const userInfo = await prisma.userInfo.findUnique({ where: { userId } });
  if (!userInfo) {
    return { ok: false, status: 404, message: "Complete profile setup first" };
  }

  const targets = calculateNutritionTargets(userInfo);
  if (!targets) {
    return { ok: false, status: 400, message: "Insufficient profile data for target calculation" };
  }

  const foods = await prisma.foodItem.findMany();
  if (!foods.length) {
    return { ok: false, status: 400, message: "No food data available. Run: npm run prisma:seed" };
  }

  const weeklyExcluded =
    excludeFoodNames ?? (await getExcludedFoodNames(userId, planDate));

  const foodByName = new Map(foods.map((food) => [food.foodName, food]));

  try {
    ensureLoaded();
  } catch {
    ensureLoadedFromDbFoods(foods);
  }

  const plan = generateStochasticMealPlan({
    targets,
    healthGoal: userInfo.healthGoal,
    dietaryPreferences: userInfo.dietaryPreferences,
    excludeFoodNames: weeklyExcluded,
  });

  const validatedItems = planItemsToDbRows(plan.items, foodByName);
  const totals = sumNutrition(validatedItems);

  if (!isWithinCalorieTolerance(totals.calories, targets.calorieGoal, 8)) {
    return {
      ok: false,
      status: 422,
      message: "Generated meal plan is outside calorie tolerance",
      totals,
      target: targets.calorieGoal,
    };
  }

  const day = startOfDay(planDate);
  const mealPlan = await prisma.mealPlan.create({
    data: {
      userId,
      planDate: day,
      calorieGoal: targets.calorieGoal,
      proteinGoal: targets.proteinGoal,
      carbsGoal: targets.carbsGoal,
      fatGoal: targets.fatGoal,
      generatedBy,
      ...(plan.notes ? { notes: plan.notes } : {}),
      items: { create: validatedItems },
    },
    include: {
      items: { include: { food: true } },
    },
  });

  return { ok: true, status: 201, targets, totals, mealPlan, excludedFoods: [...weeklyExcluded] };
}

async function regenerateMealPlanForUser({ userId, planDate, generatedBy = "stochastic" }) {
  const day = startOfDay(planDate);
  const existing = await prisma.mealPlan.findFirst({
    where: { userId, planDate: day },
  });

  if (existing) {
    await deleteMealPlanById(existing.mealPlanId);
  }

  const excludeFoodNames = await getExcludedFoodNames(userId, planDate);
  return generateMealPlanForUser({
    userId,
    planDate: day,
    generatedBy,
    excludeFoodNames,
  });
}

module.exports = {
  generateMealPlanForUser,
  regenerateMealPlanForUser,
  deleteMealPlanById,
  sumNutrition,
  isWithinCalorieTolerance,
};
