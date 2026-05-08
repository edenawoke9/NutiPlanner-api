const { generateGeminiJson } = require("../ai/geminiClient");

function buildPrompt({ userInfo, targets, foods, planDate }) {
  return `
You are a nutrition meal planner. Generate a one-day meal plan in STRICT JSON only.

Rules:
- Use only foods from allowedFoods.
- Include mealType values only from: breakfast, lunch, dinner, snack.
- Return quantity as a positive number (servings).
- Keep total calories within +-8% of calorieGoal.
- Respect user preferences/allergies/dislikes where possible.
- Return valid JSON with this shape:
{
  "items":[
    {"mealType":"breakfast","foodId":1,"quantity":1},
    {"mealType":"lunch","foodId":2,"quantity":1}
  ],
  "notes":"short note"
}

User profile:
${JSON.stringify(
    {
      age: userInfo.age,
      gender: userInfo.gender,
      weight: userInfo.weight,
      height: userInfo.height,
      healthGoal: userInfo.healthGoal,
      allergies: userInfo.allergies,
      dislikes: userInfo.dislikes,
      dietaryPreferences: userInfo.dietaryPreferences,
    },
    null,
    2
  )}

Targets:
${JSON.stringify(targets, null, 2)}

Plan date: ${planDate}

allowedFoods:
${JSON.stringify(
    foods.map((food) => ({
      foodId: food.foodId,
      foodName: food.foodName,
      foodType: food.foodType,
      calories: food.foodCalories,
      protein: food.foodProtein,
      carbs: food.carbs,
      fat: food.fat,
    })),
    null,
    2
  )}
`;
}

async function generateAiMealPlan({ userInfo, targets, foods, planDate }) {
  const prompt = buildPrompt({ userInfo, targets, foods, planDate });
  const result = await generateGeminiJson(prompt);

  if (!result || !Array.isArray(result.items) || result.items.length === 0) {
    throw new Error("Gemini did not return valid meal items");
  }

  return {
    items: result.items,
    notes: typeof result.notes === "string" ? result.notes : undefined,
  };
}

module.exports = { generateAiMealPlan };
