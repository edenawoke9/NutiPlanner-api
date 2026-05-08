const { Router } = require("express");
const { authenticate, requireAdmin } = require("../middleware");
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

adminRouter.use(authenticate, requireAdmin);

adminRouter.get("/users", listUsers);
adminRouter.put("/users/:userId", updateUserAsAdmin);
adminRouter.delete("/users/:userId", deleteUserAsAdmin);
adminRouter.get("/reports", getAdminReport);
adminRouter.get("/feedback", getAllFeedback);
adminRouter.delete("/feedback/:feedbackId", deleteFeedback);

adminRouter.get("/foods", getFoodItems);
adminRouter.post("/foods", createFoodItem);
adminRouter.put("/foods/:id", updateFoodItem);
adminRouter.delete("/foods/:id", deleteFoodItem);

module.exports = adminRouter;
