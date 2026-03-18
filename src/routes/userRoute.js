const {Router} = require("express");
const {authenticate}=require("../middleware");
const {getUserById,createUser,loginUser}=require("../controllers/userController");
const userRouter = Router();
userRouter.get("/:userId",authenticate,getUserById);
userRouter.post("/create",createUser);
userRouter.post("/login",loginUser);

module.exports = userRouter;