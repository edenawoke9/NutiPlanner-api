const prisma = require("../prisma");

function getDateRange(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function createMealLog(req, res) {
  const { logDate, mealType, items, notes } = req.body;
  const userId = req.user?.userId;

  if (!userId || !logDate || !mealType || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "logDate, mealType and items are required" });
  }

  try {
    const foodIds = items.map((item) => Number(item.foodId)).filter((id) => !Number.isNaN(id));
    const foods = await prisma.foodItem.findMany({
      where: { foodId: { in: foodIds } },
    });
    const foodMap = new Map(foods.map((food) => [food.foodId, food]));

    const preparedItems = items.map((item) => {
      const foodId = Number(item.foodId);
      const quantity = Number(item.quantity || 1);
      const food = foodMap.get(foodId);
      if (!food) {
        throw new Error(`Food item ${foodId} not found`);
      }

      const calories = Number(food.foodCalories || 0) * quantity;
      const protein = Number(food.foodProtein || 0) * quantity;
      const carbs = Number(food.carbs || 0) * quantity;
      const fat = Number(food.fat || 0) * quantity;

      return { foodId, quantity, calories, protein, carbs, fat };
    });

    const totals = preparedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const mealLog = await prisma.mealLog.create({
      data: {
        userId,
        logDate: new Date(logDate),
        mealType,
        caloriesConsumed: totals.calories,
        proteinConsumed: totals.protein,
        carbsConsumed: totals.carbs,
        fatConsumed: totals.fat,
        ...(notes ? { notes } : {}),
        items: {
          create: preparedItems,
        },
      },
      include: {
        items: {
          include: {
            food: true,
          },
        },
      },
    });
    return res.status(201).json(mealLog);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function getMealLogs(req, res) {
  const userId = req.user?.userId;
  const { date } = req.query;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const where = { userId };
    if (date) {
      const { start, end } = getDateRange(date);
      where.logDate = { gte: start, lte: end };
    }

    const logs = await prisma.mealLog.findMany({
      where,
      include: {
        items: {
          include: {
            food: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(logs);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

module.exports = {
  createMealLog,
  getMealLogs,
  createMealLogFromSuggestion: createMealLog,
};
