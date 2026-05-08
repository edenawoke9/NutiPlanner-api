const { Router } = require("express");
const { authenticate, requireAdmin } = require("../middleware");
const {
  getFoodItems,
  getFoodItemById,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
} = require("../controllers/foodItemController");

const foodRouter = Router();

foodRouter.get("/", authenticate, getFoodItems);
foodRouter.get("/:id", authenticate, getFoodItemById);

foodRouter.post("/", authenticate, requireAdmin, createFoodItem);
foodRouter.put("/:id", authenticate, requireAdmin, updateFoodItem);
foodRouter.delete("/:id", authenticate, requireAdmin, deleteFoodItem);

module.exports = foodRouter;
