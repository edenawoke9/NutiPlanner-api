const openapi = {
  openapi: "3.0.3",
  info: {
    title: "NutPlanner API",
    version: "1.0.0",
    description: "Backend API documentation for Smart Nutrition Planner.",
  },
  servers: [{ url: "https://nutiplanner-api-2.onrender.com" }],
  tags: [
    { name: "Health" },
    { name: "User" },
    { name: "Foods" },
    { name: "Meal Plans" },
    { name: "Meal Logs" },
    { name: "Progress" },
    { name: "Feedback" },
    { name: "Admin" },
    { name: "Chat" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiError: {
        type: "object",
        properties: {
          message: { type: "string" },
          error: {},
        },
      },
      UserCreateRequest: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
          role: { type: "string", enum: ["user", "admin"] },
        },
      },
      UserLoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
      FoodItemCreateRequest: {
        type: "object",
        required: ["foodName", "foodCalories"],
        properties: {
          foodName: { type: "string" },
          foodCalories: { type: "number" },
          foodProtein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
          foodType: {
            type: "string",
            enum: ["fruit", "vegetable", "meat", "dairy", "grain", "snack", "drink"],
          },
        },
      },
      MealPlanItemInput: {
        type: "object",
        required: ["mealType", "foodId", "quantity"],
        properties: {
          mealType: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
          foodId: { type: "integer" },
          quantity: { type: "number" },
          notes: { type: "string" },
        },
      },
      MealLogItemInput: {
        type: "object",
        required: ["foodId", "quantity"],
        properties: {
          foodId: { type: "integer" },
          quantity: { type: "number" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is up",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/user/create": {
      post: {
        tags: ["User"],
        summary: "Register user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserCreateRequest" } } },
        },
        responses: {
          "201": { description: "User created" },
          "400": { description: "Validation error" },
          "500": { description: "Server error" },
        },
      },
    },
    "/user/login": {
      post: {
        tags: ["User"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserLoginRequest" } } },
        },
        responses: {
          "200": { description: "Login successful (returns token)" },
          "401": { description: "Invalid credentials" },
          "404": { description: "User not found" },
        },
      },
    },
    "/user/{userId}": {
      get: {
        tags: ["User"],
        summary: "Get user profile",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "userId", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "User data" } },
      },
      put: {
        tags: ["User"],
        summary: "Upsert user info and preferences",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "userId", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fullName: { type: "string" },
                  weight: { type: "number" },
                  height: { type: "number" },
                  age: { type: "integer" },
                  gender: { type: "string", enum: ["male", "female", "other"] },
                  healthGoal: { type: "string", enum: ["lose_weight", "gain_weight", "maintain"] },
                  activityLevel: { type: "number" },
                  allergies: { type: "string" },
                  dislikes: { type: "string" },
                  dietaryPreferences: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "User info updated" } },
      },
      delete: {
        tags: ["User"],
        summary: "Delete user",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "userId", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "User deleted" } },
      },
    },
    "/user/{userId}/update": {
      put: {
        tags: ["User"],
        summary: "Update account fields",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "userId", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  email: { type: "string", format: "email" },
                  role: { type: "string", enum: ["user", "admin"] },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "User updated" } },
      },
    },
    "/foods": {
      get: {
        tags: ["Foods"],
        summary: "List foods",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "query", schema: { type: "string" } },
          {
            in: "query",
            name: "foodType",
            schema: {
              type: "string",
              enum: ["fruit", "vegetable", "meat", "dairy", "grain", "snack", "drink"],
            },
          },
        ],
        responses: { "200": { description: "Food list" } },
      },
      post: {
        tags: ["Foods"],
        summary: "Create food (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/FoodItemCreateRequest" } } },
        },
        responses: { "201": { description: "Food created" } },
      },
    },
    "/foods/{id}": {
      get: {
        tags: ["Foods"],
        summary: "Get food by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Food item" } },
      },
      put: {
        tags: ["Foods"],
        summary: "Update food (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/FoodItemCreateRequest" } } },
        },
        responses: { "200": { description: "Food updated" } },
      },
      delete: {
        tags: ["Foods"],
        summary: "Delete food (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Food deleted" } },
      },
    },
    "/meal-plans": {
      get: {
        tags: ["Meal Plans"],
        summary: "List my meal plans",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Meal plans" } },
      },
      post: {
        tags: ["Meal Plans"],
        summary: "Create meal plan manually",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["planDate", "calorieGoal", "items"],
                properties: {
                  planDate: { type: "string", format: "date" },
                  calorieGoal: { type: "number" },
                  proteinGoal: { type: "number" },
                  carbsGoal: { type: "number" },
                  fatGoal: { type: "number" },
                  startTime: { type: "string", format: "date-time" },
                  endTime: { type: "string", format: "date-time" },
                  generatedBy: { type: "string" },
                  notes: { type: "string" },
                  items: { type: "array", items: { $ref: "#/components/schemas/MealPlanItemInput" } },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Meal plan created" } },
      },
    },
    "/meal-plans/targets": {
      get: {
        tags: ["Meal Plans"],
        summary: "Get computed nutrition targets from profile",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Targets" } },
      },
    },
    "/meal-plans/generate": {
      post: {
        tags: ["Meal Plans"],
        summary: "Generate AI meal plan via Gemini",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["planDate"],
                properties: { planDate: { type: "string", format: "date" } },
              },
            },
          },
        },
        responses: {
          "201": { description: "Generated meal plan" },
          "422": { description: "Generated plan outside tolerance" },
        },
      },
    },
    "/meal-plans/{id}/regenerate": {
      post: {
        tags: ["Meal Plans"],
        summary: "Regenerate AI meal plan",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { "201": { description: "Regenerated meal plan" } },
      },
    },
    "/meal-logs": {
      get: {
        tags: ["Meal Logs"],
        summary: "List my meal logs",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "query", name: "date", schema: { type: "string", format: "date" } }],
        responses: { "200": { description: "Meal logs" } },
      },
      post: {
        tags: ["Meal Logs"],
        summary: "Create meal log",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["logDate", "mealType", "items"],
                properties: {
                  logDate: { type: "string", format: "date" },
                  mealType: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
                  notes: { type: "string" },
                  items: { type: "array", items: { $ref: "#/components/schemas/MealLogItemInput" } },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Meal log created" } },
      },
    },
    "/meal-logs/log-from-chat": {
      post: {
        tags: ["Meal Logs"],
        summary: "Create meal log from chatbot suggestion payload",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["logDate", "mealType", "items"],
                properties: {
                  logDate: { type: "string", format: "date" },
                  mealType: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
                  notes: { type: "string" },
                  items: { type: "array", items: { $ref: "#/components/schemas/MealLogItemInput" } },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Meal log created" } },
      },
    },
    "/progress": {
      get: {
        tags: ["Progress"],
        summary: "Get progress history",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "from", schema: { type: "string", format: "date" } },
          { in: "query", name: "to", schema: { type: "string", format: "date" } },
        ],
        responses: { "200": { description: "Progress history" } },
      },
      post: {
        tags: ["Progress"],
        summary: "Add progress entry",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["date"],
                properties: {
                  date: { type: "string", format: "date" },
                  weight: { type: "number" },
                  BMI: { type: "number" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Progress entry created" } },
      },
    },
    "/progress/summary": {
      get: {
        tags: ["Progress"],
        summary: "Get daily progress summary",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "query", name: "date", required: true, schema: { type: "string", format: "date" } }],
        responses: { "200": { description: "Summary with calories and trends" } },
      },
    },
    "/feedback/me": {
      get: {
        tags: ["Feedback"],
        summary: "Get my feedback list",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Feedback list" } },
      },
    },
    "/feedback": {
      post: {
        tags: ["Feedback"],
        summary: "Submit feedback",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating"],
                properties: {
                  rating: { type: "integer", minimum: 1, maximum: 5 },
                  comment: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Feedback submitted" } },
      },
    },
    "/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List users (admin)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Users list" } },
      },
    },
    "/admin/users/{userId}": {
      put: {
        tags: ["Admin"],
        summary: "Update user (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "userId", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  email: { type: "string", format: "email" },
                  role: { type: "string", enum: ["user", "admin"] },
                },
              },
            },
          },
        },
        responses: { "200": { description: "User updated" } },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete user (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "userId", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "User deleted" } },
      },
    },
    "/admin/reports": {
      get: {
        tags: ["Admin"],
        summary: "Get admin report",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Aggregated report" } },
      },
    },
    "/admin/feedback": {
      get: {
        tags: ["Admin"],
        summary: "List feedback (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "userId", schema: { type: "integer" } },
          { in: "query", name: "rating", schema: { type: "integer" } },
          { in: "query", name: "from", schema: { type: "string", format: "date-time" } },
        ],
        responses: { "200": { description: "Feedback list" } },
      },
    },
    "/admin/feedback/{feedbackId}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete feedback (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "feedbackId", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Feedback deleted" } },
      },
    },
    "/admin/foods": {
      get: {
        tags: ["Admin"],
        summary: "List foods (admin)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Food list" } },
      },
      post: {
        tags: ["Admin"],
        summary: "Create food (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/FoodItemCreateRequest" } } },
        },
        responses: { "201": { description: "Food created" } },
      },
    },
    "/admin/foods/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Update food (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/FoodItemCreateRequest" } } },
        },
        responses: { "200": { description: "Food updated" } },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete food (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Food deleted" } },
      },
    },
    "/chat/message": {
      post: {
        tags: ["Chat"],
        summary: "Chat with nutrition assistant",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: { message: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Chat response + optional meal suggestion" },
          "500": { description: "Gemini error or internal failure" },
        },
      },
    },
  },
};

module.exports = openapi;
