const prisma = require("../prisma");
const { calculateNutritionTargets } = require("../services/nutritionTargetService");
const {
  generateMealPlanForUser,
  regenerateMealPlanForUser,
  deleteMealPlanById,
} = require("../services/mealPlanning/mealPlanService");
const { getExcludedFoodNames } = require("../services/mealPlanning/weeklyFoodLimit");

function calculateItemNutrition(food, quantity) {
  return {
    calories: Number(food.foodCalories || 0) * quantity,
    protein: Number(food.foodProtein || 0) * quantity,
    carbs: Number(food.carbs || 0) * quantity,
    fat: Number(food.fat || 0) * quantity,
  };
}

async function getMealPlans(req, res) {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const plans = await prisma.mealPlan.findMany({
      where: { userId },
      include: {
        items: {
          include: { food: true },
        },
      },
      orderBy: { planDate: "desc" },
    });
    return res.status(200).json(plans);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function createMealPlan(req, res) {
  const userId = req.user?.userId;
  const {
    planDate,
    calorieGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
    items,
    startTime,
    endTime,
    generatedBy,
    notes,
  } = req.body;

  if (!userId || !planDate || calorieGoal === undefined || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "planDate, calorieGoal and items are required" });
  }

  try {
    const foodIds = items.map((item) => Number(item.foodId)).filter((id) => !Number.isNaN(id));
    const foods = await prisma.foodItem.findMany({ where: { foodId: { in: foodIds } } });
    const foodMap = new Map(foods.map((food) => [food.foodId, food]));

    const planItems = items.map((item) => {
      const foodId = Number(item.foodId);
      const quantity = Number(item.quantity || 1);
      const food = foodMap.get(foodId);
      if (!food) throw new Error(`Food item ${foodId} not found`);
      if (!["breakfast", "lunch", "dinner", "snack"].includes(item.mealType)) {
        throw new Error(`Invalid mealType ${item.mealType}`);
      }

      const nutrition = calculateItemNutrition(food, quantity);
      return {
        mealType: item.mealType,
        foodId,
        quantity,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        ...(item.notes ? { notes: item.notes } : {}),
      };
    });

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        planDate: new Date(planDate),
        calorieGoal: Number(calorieGoal),
        ...(proteinGoal !== undefined ? { proteinGoal: Number(proteinGoal) } : {}),
        ...(carbsGoal !== undefined ? { carbsGoal: Number(carbsGoal) } : {}),
        ...(fatGoal !== undefined ? { fatGoal: Number(fatGoal) } : {}),
        ...(startTime ? { startTime: new Date(startTime) } : {}),
        ...(endTime ? { endTime: new Date(endTime) } : {}),
        ...(generatedBy ? { generatedBy } : {}),
        ...(notes ? { notes } : {}),
        items: {
          create: planItems,
        },
      },
      include: {
        items: {
          include: { food: true },
        },
      },
    });

    return res.status(201).json(mealPlan);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function getNutritionTargets(req, res) {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const userInfo = await prisma.userInfo.findUnique({ where: { userId } });
    if (!userInfo) {
      return res.status(404).json({ message: "Complete profile setup first" });
    }

    const targets = calculateNutritionTargets(userInfo);
    if (!targets) {
      return res.status(400).json({ message: "Insufficient profile data for target calculation" });
    }

    return res.status(200).json(targets);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function generateMealPlan(req, res) {
  const userId = req.user?.userId;
  const { planDate } = req.body;
  if (!userId || !planDate) {
    return res.status(400).json({ message: "planDate is required" });
  }

  try {
    const excludeFoodNames = await getExcludedFoodNames(userId, planDate);
    const result = await generateMealPlanForUser({
      userId,
      planDate,
      generatedBy: "stochastic",
      excludeFoodNames,
    });

    if (!result.ok) {
      return res.status(result.status).json({
        message: result.message,
        ...(result.totals ? { totals: result.totals, target: result.target } : {}),
      });
    }

    return res.status(result.status).json({
      targets: result.targets,
      totals: result.totals,
      mealPlan: result.mealPlan,
      excludedFoods: result.excludedFoods,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message || error });
  }
}

async function regenerateMealPlan(req, res) {
  const userId = req.user?.userId;
  const mealPlanId = Number(req.params.id);
  if (!userId || Number.isNaN(mealPlanId)) {
    return res.status(400).json({ message: "Invalid mealPlanId" });
  }

  try {
    const plan = await prisma.mealPlan.findFirst({
      where: { mealPlanId, userId },
    });
    if (!plan) return res.status(404).json({ message: "Meal plan not found" });

    await deleteMealPlanById(mealPlanId);

    const result = await regenerateMealPlanForUser({
      userId,
      planDate: plan.planDate,
      generatedBy: "stochastic",
    });

    if (!result.ok) {
      return res.status(result.status).json({
        message: result.message,
        ...(result.totals ? { totals: result.totals, target: result.target } : {}),
      });
    }

    return res.status(result.status).json({
      targets: result.targets,
      totals: result.totals,
      mealPlan: result.mealPlan,
      excludedFoods: result.excludedFoods,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

module.exports = {
  getMealPlans,
  createMealPlan,
  getNutritionTargets,
  generateMealPlan,
  regenerateMealPlan,
};
