const { Router } = require("express");
const { authenticate } = require("../middleware");
const { getHydration, upsertHydration } = require("../controllers/hydrationController");

const hydrationRouter = Router();

hydrationRouter.get("/", authenticate, getHydration);
hydrationRouter.put("/", authenticate, upsertHydration);

module.exports = hydrationRouter;
