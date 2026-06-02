const prisma = require("../prisma");

const FOOD_TYPES = ["fruit", "vegetable", "meat", "dairy", "grain", "snack", "drink"];

function validateFoodType(foodType) {
  if (foodType === undefined || foodType === null || foodType === "") {
    return { ok: true, value: undefined };
  }
  if (FOOD_TYPES.includes(foodType)) {
    return { ok: true, value: foodType };
  }
  return {
    ok: false,
    message: `Invalid foodType. Allowed values: ${FOOD_TYPES.join(", ")}`,
  };
}

async function getFoodItems(req, res) {
  const { query, foodType } = req.query;

  try {
    const foodItems = await prisma.foodItem.findMany({
      where: {
        ...(foodType && { foodType }),
        ...(query && {
          foodName: {
            contains: query,
          },
        }),
      },
      orderBy: {
        foodName: "asc",
      },
    });

    return res.status(200).json(foodItems);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function getFoodItemById(req, res) {
  const foodId = parseInt(req.params.id, 10);

  if (Number.isNaN(foodId)) {
    return res.status(400).json({ message: "Invalid food id" });
  }

  try {
    const foodItem = await prisma.foodItem.findUnique({
      where: { foodId },
    });

    if (!foodItem) {
      return res.status(404).json({ message: "Food item not found" });
    }

    return res.status(200).json(foodItem);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function createFoodItem(req, res) {
  const { foodName, foodCalories, foodProtein, carbs, fat, category, foodType } = req.body;

  if (!foodName || foodCalories === undefined) {
    return res.status(400).json({ message: "foodName and foodCalories are required" });
  }

  const foodTypeCheck = validateFoodType(foodType);
  if (!foodTypeCheck.ok) {
    return res.status(400).json({ message: foodTypeCheck.message });
  }

  try {
    const foodItem = await prisma.foodItem.create({
      data: {
        foodName,
        foodCalories: Number(foodCalories),
        foodProtein: foodProtein !== undefined ? Number(foodProtein) : 0,
        carbs: carbs !== undefined ? Number(carbs) : 0,
        fat: fat !== undefined ? Number(fat) : 0,
        ...(category !== undefined && { category }),
        ...(foodTypeCheck.value !== undefined && { foodType: foodTypeCheck.value }),
      },
    });

    return res.status(201).json(foodItem);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function updateFoodItem(req, res) {
  const foodId = parseInt(req.params.id, 10);

  if (Number.isNaN(foodId)) {
    return res.status(400).json({ message: "Invalid food id" });
  }

  const { foodName, foodCalories, foodProtein, carbs, fat, category, foodType } = req.body;

  const foodTypeCheck = validateFoodType(foodType);
  if (!foodTypeCheck.ok) {
    return res.status(400).json({ message: foodTypeCheck.message });
  }

  try {
    const existing = await prisma.foodItem.findUnique({
      where: { foodId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Food item not found" });
    }

    const updated = await prisma.foodItem.update({
      where: { foodId },
      data: {
        ...(foodName !== undefined && { foodName }),
        ...(foodCalories !== undefined && { foodCalories: Number(foodCalories) }),
        ...(foodProtein !== undefined && { foodProtein: Number(foodProtein) }),
        ...(carbs !== undefined && { carbs: Number(carbs) }),
        ...(fat !== undefined && { fat: Number(fat) }),
        ...(category !== undefined && { category }),
        ...(foodTypeCheck.value !== undefined && { foodType: foodTypeCheck.value }),
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function deleteFoodItem(req, res) {
  const foodId = parseInt(req.params.id, 10);

  if (Number.isNaN(foodId)) {
    return res.status(400).json({ message: "Invalid food id" });
  }

  try {
    const existing = await prisma.foodItem.findUnique({
      where: { foodId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Food item not found" });
    }

    await prisma.foodItem.delete({
      where: { foodId },
    });

    return res.status(200).json({ message: "Food item deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

module.exports = {
  getFoodItems,
  getFoodItemById,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
};