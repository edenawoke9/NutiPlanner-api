const prisma = require("../prisma");
const { calculateNutritionTargets } = require("../services/nutritionTargetService");
const { generateAiMealPlan } = require("../services/mealPlanning/aiMealPlan");

function calculateItemNutrition(food, quantity) {
  return {
    calories: Number(food.foodCalories || 0) * quantity,
    protein: Number(food.foodProtein || 0) * quantity,
    carbs: Number(food.carbs || 0) * quantity,
    fat: Number(food.fat || 0) * quantity,
  };
}

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
  const diffPct = Math.abs(calories - target) / target * 100;
  return diffPct <= tolerancePct;
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
    const userInfo = await prisma.userInfo.findUnique({ where: { userId } });
    if (!userInfo) return res.status(404).json({ message: "Complete profile setup first" });

    const targets = calculateNutritionTargets(userInfo);
    if (!targets) {
      return res.status(400).json({ message: "Insufficient profile data for target calculation" });
    }

    const foods = await prisma.foodItem.findMany({
      orderBy: { foodName: "asc" },
      take: 80,
    });
    if (!foods.length) return res.status(400).json({ message: "No food data available" });

    const aiPlan = await generateAiMealPlan({
      userInfo,
      targets,
      foods,
      planDate,
    });

    const foodMap = new Map(foods.map((food) => [food.foodId, food]));
    const validatedItems = aiPlan.items.map((item) => {
      const foodId = Number(item.foodId);
      const quantity = Number(item.quantity || 1);
      const food = foodMap.get(foodId);
      if (!food) throw new Error(`AI selected unknown foodId ${foodId}`);
      if (!["breakfast", "lunch", "dinner", "snack"].includes(item.mealType)) {
        throw new Error(`AI returned invalid mealType ${item.mealType}`);
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
      };
    });

    const totals = sumNutrition(validatedItems);
    if (!isWithinCalorieTolerance(totals.calories, targets.calorieGoal, 8)) {
      return res.status(422).json({
        message: "Generated meal plan is outside calorie tolerance",
        totals,
        target: targets.calorieGoal,
      });
    }

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        planDate: new Date(planDate),
        calorieGoal: targets.calorieGoal,
        proteinGoal: targets.proteinGoal,
        carbsGoal: targets.carbsGoal,
        fatGoal: targets.fatGoal,
        generatedBy: "gemini",
        ...(aiPlan.notes ? { notes: aiPlan.notes } : {}),
        items: {
          create: validatedItems,
        },
      },
      include: {
        items: {
          include: { food: true },
        },
      },
    });

    return res.status(201).json({ targets, totals, mealPlan });
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

    await prisma.mealPlanItem.deleteMany({ where: { mealPlanId } });
    await prisma.mealPlan.delete({ where: { mealPlanId } });

    req.body.planDate = plan.planDate;
    return generateMealPlan(req, res);
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
