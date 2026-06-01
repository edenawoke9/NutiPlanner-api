const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
const openapi = require("./openapi");
const userRouter = require("./routes/userRoute");
const foodRouter = require("./routes/foodRoute");
const mealPlanRouter = require("./routes/mealPlanRoute");
const mealLogRouter = require("./routes/mealLogRoute");
const progressRouter = require("./routes/progressRoute");
const hydrationRouter = require("./routes/hydrationRoute");
const feedbackRouter = require("./routes/feedbackRoute");
const adminRouter = require("./routes/adminRoute");
const chatRouter = require("./routes/chatRoute");
const { rateLimit } = require("./rateLimit");
const { startDailyMealPlanCron } = require("./jobs/scheduleDailyMealPlans");
const { ensureMigrations } = require("./db/ensureMigrations");

dotenv.config();

// Prevent 304 + empty body on API GET (breaks fetch clients that expect JSON)
app.set("etag", false);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  next();
});

app.get("/health", (req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.get("/openapi.json", (req, res) => {
  return res.status(200).json(openapi);
});

app.get("/docs", (req, res) => {
  return res.status(200).send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>NutPlanner API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>body { margin: 0; background: #fafafa; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        displayRequestDuration: true
      });
    </script>
  </body>
</html>`);
});

app.use("/user", userRouter);
app.use("/foods", foodRouter);
app.use(
  "/meal-plans",
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    message: "Too many meal-plan requests. Please try again shortly.",
  }),
  mealPlanRouter
);
app.use("/meal-logs", mealLogRouter);
app.use("/progress", progressRouter);
app.use("/hydration", hydrationRouter);
app.use("/feedback", feedbackRouter);
app.use("/admin", adminRouter);
app.use(
  "/chat",
  rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: "Too many chat requests. Please slow down.",
  }),
  chatRouter
);

app.use((req, res) => {
  return res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});

const requestedPort = 4001;

function startServer(port, isFallback = false) {
  const server = app.listen(port, () => {
    console.log(`app running on port ${port}`);
    startDailyMealPlanCron();
  });

  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE" && !isFallback) {
      return;
    }
  });
}

async function bootstrap() {
  try {
    await ensureMigrations();
    startServer(requestedPort);
  } catch (err) {
    console.error("Failed to apply database migrations:", err);
    process.exit(1);
  }
}

bootstrap();