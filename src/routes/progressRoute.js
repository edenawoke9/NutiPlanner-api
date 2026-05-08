const { Router } = require("express");
const { authenticate } = require("../middleware");
const { addProgress, getProgress, getProgressSummary } = require("../controllers/progressController");

const progressRouter = Router();

progressRouter.get("/", authenticate, getProgress);
progressRouter.get("/summary", authenticate, getProgressSummary);
progressRouter.post("/", authenticate, addProgress);

module.exports = progressRouter;
