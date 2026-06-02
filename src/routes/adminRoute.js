const { Router } = require("express");
const { authenticate, requireAdmin, requireFoodManager } = require("../middleware");
const {
  listUsers,
  updateUserAsAdmin,
  deleteUserAsAdmin,
  getAdminReport,
} = require("../controllers/adminController");
const { getAllFeedback, deleteFeedback } = require("../controllers/feedbackController");
const {
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getFoodItems,
} = require("../controllers/foodItemController");

const adminRouter = Router();

adminRouter.use(authenticate);

adminRouter.get("/users", requireAdmin, listUsers);
adminRouter.put("/users/:userId", requireAdmin, updateUserAsAdmin);
adminRouter.delete("/users/:userId", requireAdmin, deleteUserAsAdmin);
adminRouter.get("/reports", requireAdmin, getAdminReport);
adminRouter.get("/feedback", requireAdmin, getAllFeedback);
adminRouter.delete("/feedback/:feedbackId", requireAdmin, deleteFeedback);

adminRouter.get("/foods", requireFoodManager, getFoodItems);
adminRouter.post("/foods", requireFoodManager, createFoodItem);
adminRouter.put("/foods/:id", requireFoodManager, updateFoodItem);
adminRouter.delete("/foods/:id", requireFoodManager, deleteFoodItem);

module.exports = adminRouter;
