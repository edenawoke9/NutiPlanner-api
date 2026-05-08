const { Router } = require("express");
const { authenticate } = require("../middleware");
const { chatMessage } = require("../controllers/chatController");

const chatRouter = Router();

chatRouter.post("/message", authenticate, chatMessage);

module.exports = chatRouter;
