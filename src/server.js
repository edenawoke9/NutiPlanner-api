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
const feedbackRouter = require("./routes/feedbackRoute");
const adminRouter = require("./routes/adminRoute");
const chatRouter = require("./routes/chatRoute");
const { rateLimit } = require("./rateLimit");
const { startDailyMealPlanCron } = require("./jobs/scheduleDailyMealPlans");
const { ensureMigrations } = require("./db/ensureMigrations");

dotenv.config();

// Prevent 304 + empty body on API GET (breaks fetch clients that expect JSON)
app.set("etag", false);

function debugLog(payload) {
  fetch("http://127.0.0.1:7786/ingest/bbe5d152-e1f2-4067-8548-f0d2657bf8f5", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "ce7467",
    },
    body: JSON.stringify({
      sessionId: "ce7467",
      runId: "run1",
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}

// #region agent log
debugLog({
  hypothesisId: "H1",
  location: "src/server.js:36",
  message: "Server module initialized",
  data: { pid: process.pid, nodeEnv: process.env.NODE_ENV || null },
});
// #endregion

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
    // #region agent log
    debugLog({
      hypothesisId: "H5",
      location: "src/server.js:121",
      message: "listen callback fired",
      data: { port, isFallback },
    });
    // #endregion
    console.log(`app running on port ${port}`);
    startDailyMealPlanCron();
  });

  server.on("error", (error) => {
    // #region agent log
    debugLog({
      hypothesisId: "H5",
      location: "src/server.js:132",
      message: "server error event",
      data: { message: error?.message || null, code: error?.code || null, port, isFallback },
    });
    // #endregion

    if (error?.code === "EADDRINUSE" && !isFallback) {
      debugLog({
        hypothesisId: "H5",
        location: "src/server.js:141",
        message: "configured port 4001 already in use",
        data: { port, isFallback },
      });
      return;
    }
  });

  server.on("close", () => {
    // #region agent log
    debugLog({
      hypothesisId: "H5",
      location: "src/server.js:148",
      message: "server close event",
      data: { port, isFallback },
    });
    // #endregion
  });
}

async function bootstrap() {
  try {
    await ensureMigrations();
    // #region agent log
    fetch("http://127.0.0.1:7747/ingest/2d44f485-f941-440b-956a-846c1c74f62c", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "6c9c86" },
      body: JSON.stringify({
        sessionId: "6c9c86",
        hypothesisId: "B",
        location: "src/server.js:bootstrap",
        message: "ensureMigrations ok, starting server",
        data: { port: requestedPort },
        timestamp: Date.now(),
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    startServer(requestedPort);
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7747/ingest/2d44f485-f941-440b-956a-846c1c74f62c", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "6c9c86" },
      body: JSON.stringify({
        sessionId: "6c9c86",
        hypothesisId: "B",
        location: "src/server.js:bootstrap:error",
        message: "ensureMigrations failed",
        data: { message: err?.message?.slice(0, 300) },
        timestamp: Date.now(),
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    console.error("Failed to apply database migrations:", err);
    process.exit(1);
  }
}

bootstrap();