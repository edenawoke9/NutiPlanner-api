const { Router } = require("express");
const { authenticate } = require("../middleware");
const { createFeedback, getMyFeedback } = require("../controllers/feedbackController");

const feedbackRouter = Router();

feedbackRouter.post("/", authenticate, createFeedback);
feedbackRouter.get("/mine", authenticate, getMyFeedback);

module.exports = feedbackRouter;