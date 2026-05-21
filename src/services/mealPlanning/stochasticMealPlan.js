const { loadFoodCsv, FEATURES } = require("./foodCsv");

const MEAL_GROUPS = {
  breakfast: ["Breakfast", "Bread"],
  lunch: ["Mixed", "Beef Dish", "Chicken Dish", "Lamb Dish", "Seafood", "Legume Stew"],
  dinner: ["Vegetable", "Salad", "Mixed", "Legume Stew"],
};

const MEAL_SPLITS = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.4,
};

let foodRows = null;
let scaler = null;

function fitStandardScaler(matrix) {
  const nFeatures = matrix[0].length;
  const means = new Array(nFeatures).fill(0);
  const stds = new Array(nFeatures).fill(0);

  for (const row of matrix) {
    for (let j = 0; j < nFeatures; j++) {
      means[j] += row[j];
    }
  }
  for (let j = 0; j < nFeatures; j++) {
    means[j] /= matrix.length;
  }

  for (const row of matrix) {
    for (let j = 0; j < nFeatures; j++) {
      const diff = row[j] - means[j];
      stds[j] += diff * diff;
    }
  }
  for (let j = 0; j < nFeatures; j++) {
    stds[j] = Math.sqrt(stds[j] / matrix.length) || 1;
  }

  return { means, stds };
}

function transformStandardScaler(matrix, { means, stds }) {
  return matrix.map((row) =>
    row.map((value, j) => (value - means[j]) / stds[j])
  );
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

function dedupeByFoodName(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const name = row.Food?.trim();
    if (!name || seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

function buildScalerFromRows(rows) {
  foodRows = dedupeByFoodName(rows);
  if (!foodRows.length) {
    throw new Error("No food rows available for meal matching");
  }
  const featureMatrix = foodRows.map((row) =>
    FEATURES.map((col) => row[col] ?? 0)
  );
  scaler = fitStandardScaler(featureMatrix);
}

function foodItemToCsvRow(food) {
  return {
    Food: food.foodName,
    Category: food.category || "Mixed",
    Protein_g: Number(food.foodProtein || 0),
    Fat_g: Number(food.fat || 0),
    Carbs_g: Number(food.carbs || 0),
    Fiber_g: 2,
    Calories_kcal: Number(food.foodCalories || 0),
  };
}

/** Use when ethiopian_food_nutrition_300.csv is missing (e.g. on Render). */
function ensureLoadedFromDbFoods(foods) {
  if (foodRows && scaler) return;
  buildScalerFromRows(foods.map(foodItemToCsvRow));
}

function ensureLoaded() {
  if (foodRows && scaler) return;

  try {
    buildScalerFromRows(loadFoodCsv());
  } catch (err) {
    throw new Error(
      `Food CSV not available (${err.message}). Seed FoodItem table or set FOOD_CSV_PATH.`
    );
  }
}

function resolveGoal(healthGoal, dietaryPreferences) {
  if (healthGoal === "diabetes") return "diabetes";
  const prefs = (dietaryPreferences || "").toLowerCase();
  if (prefs.includes("diabetes")) return "diabetes";
  return healthGoal || "maintain";
}

function getStochasticMatch(targetNutrients, mealType, goal, excludeFoodNames = new Set()) {
  ensureLoaded();

  const allowedCategories = MEAL_GROUPS[mealType] || [];
  let filtered = foodRows.filter((row) =>
    allowedCategories.includes(row.Category)
  );

  if (goal === "diabetes") {
    filtered = filtered.filter((row) => row.Carbs_g < 60);
  }

  if (excludeFoodNames.size > 0) {
    filtered = filtered.filter((row) => !excludeFoodNames.has(row.Food));
  }

  if (filtered.length === 0) {
    filtered = foodRows.filter((row) => !excludeFoodNames.has(row.Food));
  }

  if (filtered.length === 0) {
    filtered = [...foodRows];
  }

  const targetScaled = transformStandardScaler([targetNutrients], scaler)[0];
  const filteredMatrix = filtered.map((row) =>
    FEATURES.map((col) => row[col] ?? 0)
  );
  const filteredScaled = transformStandardScaler(filteredMatrix, scaler);

  const scored = filtered.map((row, idx) => ({
    row,
    score: cosineSimilarity(targetScaled, filteredScaled[idx]),
  }));

  scored.sort((a, b) => b.score - a.score);
  const poolSize = Math.min(20, scored.length);
  const topCandidates = scored.slice(0, poolSize);
  const pick = topCandidates[Math.floor(Math.random() * topCandidates.length)];
  return pick.row;
}

function generateStochasticMealPlan({
  targets,
  healthGoal,
  dietaryPreferences,
  excludeFoodNames = new Set(),
}) {
  ensureLoaded();

  const goal = resolveGoal(healthGoal, dietaryPreferences);
  const { calorieGoal, proteinGoal, carbsGoal, fatGoal } = targets;
  const items = [];
  const usedToday = new Set(excludeFoodNames);

  for (const [mealType, ratio] of Object.entries(MEAL_SPLITS)) {
    const targetNutrients = [
      proteinGoal * ratio,
      fatGoal * ratio,
      carbsGoal * ratio,
      2.0,
    ];
    const match = getStochasticMatch(targetNutrients, mealType, goal, usedToday);
    usedToday.add(match.Food);

    const portionGrams =
      match.Calories_kcal <= 0
        ? 100
        : (calorieGoal * ratio / match.Calories_kcal) * 100;

    const portionFactor = portionGrams / 100;

    items.push({
      mealType,
      foodName: match.Food,
      category: match.Category,
      portionGrams: Math.round(portionGrams * 10) / 10,
      calories: Math.round(calorieGoal * ratio * 10) / 10,
      protein: Math.round(match.Protein_g * portionFactor * 10) / 10,
      fat: Math.round(match.Fat_g * portionFactor * 10) / 10,
      carbs: Math.round(match.Carbs_g * portionFactor * 10) / 10,
    });
  }

  return {
    items,
    notes: "Generated via nutritional matching",
  };
}

module.exports = {
  generateStochasticMealPlan,
  MEAL_GROUPS,
  ensureLoaded,
  ensureLoadedFromDbFoods,
};
