const { Router } = require("express");
const { authenticate, requireSelfOrAdmin } = require("../middleware");
const {
  getUserById,
  createUser,
  loginUser,
  updateUserInfo,
  deleteUser,
  updateUser,
} = require("../controllers/userController");
const userRouter = Router();

userRouter.post("/create", createUser);
userRouter.post("/login", loginUser);

userRouter
  .route("/:userId")
  .get(authenticate, requireSelfOrAdmin, getUserById)
  .put(authenticate, requireSelfOrAdmin, updateUserInfo)
  .delete(authenticate, requireSelfOrAdmin, deleteUser);

userRouter.put("/:userId/update", authenticate, requireSelfOrAdmin, updateUser);

module.exports = userRouter;