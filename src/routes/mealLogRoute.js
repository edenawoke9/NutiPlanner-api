const { Router } = require("express");
const { authenticate } = require("../middleware");
const {
  createMealLog,
  getMealLogs,
  createMealLogFromSuggestion,
} = require("../controllers/mealLogController");

const mealLogRouter = Router();

mealLogRouter.get("/", authenticate, getMealLogs);
mealLogRouter.post("/", authenticate, createMealLog);
mealLogRouter.post("/log-from-chat", authenticate, createMealLogFromSuggestion);

module.exports = mealLogRouter;
