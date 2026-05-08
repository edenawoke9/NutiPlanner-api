const { Router } = require("express");
const { authenticate } = require("../middleware");
const { submitFeedback, getMyFeedback } = require("../controllers/feedbackController");

const feedbackRouter = Router();

feedbackRouter.get("/me", authenticate, getMyFeedback);
feedbackRouter.post("/", authenticate, submitFeedback);

module.exports = feedbackRouter;
