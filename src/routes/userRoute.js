const {Router} = require("express");
const {authenticate}=require("../middleware");
const {getUserById,createUser,loginUser,updateUserInfo,deleteUser,updateUser}=require("../controllers/userController");
const userRouter = Router();
userRouter.route("/:userId")
.get(authenticate,getUserById)
.put(authenticate,updateUserInfo)
.delete(authenticate,deleteUser);
userRouter.put("/:userId/update",authenticate,updateUser);
userRouter.post("/create",createUser);
userRouter.post("/login",loginUser);

module.exports = userRouter;