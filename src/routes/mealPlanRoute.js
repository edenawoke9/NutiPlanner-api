const { Router } = require("express");
const { authenticate } = require("../middleware");
const {
  getMealPlans,
  createMealPlan,
  getNutritionTargets,
  generateMealPlan,
  regenerateMealPlan,
  regenerateMealPlanByDate,
} = require("../controllers/mealPlanController");

const mealPlanRouter = Router();

mealPlanRouter.get("/", authenticate, getMealPlans);
mealPlanRouter.get("/targets", authenticate, getNutritionTargets);
mealPlanRouter.post("/generate", authenticate, generateMealPlan);
mealPlanRouter.post("/regenerate-day", authenticate, regenerateMealPlanByDate);
mealPlanRouter.post("/:id/regenerate", authenticate, regenerateMealPlan);
mealPlanRouter.post("/", authenticate, createMealPlan);

module.exports = mealPlanRouter;
