const { Router } = require("express");
const { authenticate, requireFoodManager } = require("../middleware");
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

foodRouter.post("/", authenticate, requireFoodManager, createFoodItem);
foodRouter.put("/:id", authenticate, requireFoodManager, updateFoodItem);
foodRouter.delete("/:id", authenticate, requireFoodManager, deleteFoodItem);

module.exports = foodRouter;
