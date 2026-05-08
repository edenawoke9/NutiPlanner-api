const prisma = require("../prisma");
const { generateGeminiJson } = require("../services/ai/geminiClient");

function buildChatPrompt({ message, userInfo, latestPlan, foods }) {
  return `
You are a helpful nutrition chatbot.
Respond with strict JSON:
{
  "reply": "short helpful response",
  "mealSuggestion": {
    "mealType": "breakfast|lunch|dinner|snack",
    "items": [{"foodId": 1, "quantity": 1}],
    "rationale": "why this matches user"
  }
}

Rules:
- Use only provided foods for suggestions.
- If no meal suggestion is appropriate, set mealSuggestion to null.
- Keep guidance non-medical and practical.

User profile:
${JSON.stringify(
    userInfo
      ? {
          age: userInfo.age,
          gender: userInfo.gender,
          healthGoal: userInfo.healthGoal,
          allergies: userInfo.allergies,
          dislikes: userInfo.dislikes,
          dietaryPreferences: userInfo.dietaryPreferences,
        }
      : {},
    null,
    2
  )}

Latest meal plan summary:
${JSON.stringify(
    latestPlan
      ? {
          planDate: latestPlan.planDate,
          calorieGoal: latestPlan.calorieGoal,
          proteinGoal: latestPlan.proteinGoal,
          carbsGoal: latestPlan.carbsGoal,
          fatGoal: latestPlan.fatGoal,
        }
      : {},
    null,
    2
  )}

Available foods:
${JSON.stringify(
    foods.map((food) => ({
      foodId: food.foodId,
      foodName: food.foodName,
      calories: food.foodCalories,
      protein: food.foodProtein,
      carbs: food.carbs,
      fat: food.fat,
      type: food.foodType,
    })),
    null,
    2
  )}

User message:
${message}
`;
}

async function chatMessage(req, res) {
  const userId = req.user?.userId;
  const { message } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ message: "message is required" });
  }

  try {
    const [userInfo, latestPlan, foods] = await Promise.all([
      prisma.userInfo.findUnique({ where: { userId } }),
      prisma.mealPlan.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.foodItem.findMany({
        orderBy: { foodName: "asc" },
        take: 50,
      }),
    ]);

    const prompt = buildChatPrompt({
      message,
      userInfo,
      latestPlan,
      foods,
    });

    const response = await generateGeminiJson(prompt);
    const mealSuggestion = response?.mealSuggestion || null;

    if (mealSuggestion?.items?.length) {
      const foodIds = mealSuggestion.items.map((item) => Number(item.foodId));
      const validFoods = await prisma.foodItem.findMany({ where: { foodId: { in: foodIds } } });
      const validIds = new Set(validFoods.map((item) => item.foodId));
      mealSuggestion.items = mealSuggestion.items.filter((item) =>
        validIds.has(Number(item.foodId))
      );
    }

    return res.status(200).json({
      reply: response?.reply || "I can help with meal choices and nutrition planning.",
      mealSuggestion,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message || error });
  }
}

module.exports = { chatMessage };
