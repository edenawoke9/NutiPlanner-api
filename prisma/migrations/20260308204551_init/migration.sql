-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "HealthGoal" AS ENUM ('lose_weight', 'gain_weight', 'maintain');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('fruit', 'vegetable', 'meat', 'dairy', 'grain', 'snack', 'drink');

-- CreateTable
CREATE TABLE "User" (
    "userId" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserInfo" (
    "userInfoId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "age" INTEGER,
    "gender" "Gender",
    "healthGoal" "HealthGoal" NOT NULL,
    "activityLevel" DOUBLE PRECISION DEFAULT 1.2,
    "allergies" VARCHAR(255),
    "dislikes" VARCHAR(255),
    "dietaryPreferences" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInfo_pkey" PRIMARY KEY ("userInfoId")
);

-- CreateTable
CREATE TABLE "FoodItem" (
    "foodId" SERIAL NOT NULL,
    "foodName" VARCHAR(100) NOT NULL,
    "foodCalories" DOUBLE PRECISION NOT NULL,
    "foodProtein" DOUBLE PRECISION DEFAULT 0,
    "carbs" DOUBLE PRECISION DEFAULT 0,
    "fat" DOUBLE PRECISION DEFAULT 0,
    "category" VARCHAR(50),
    "foodType" "FoodType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("foodId")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "mealPlanId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planDate" DATE NOT NULL,
    "calorieGoal" INTEGER NOT NULL,
    "proteinGoal" DOUBLE PRECISION DEFAULT 0,
    "carbsGoal" DOUBLE PRECISION DEFAULT 0,
    "fatGoal" DOUBLE PRECISION DEFAULT 0,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "generatedBy" VARCHAR(30),
    "notes" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("mealPlanId")
);

-- CreateTable
CREATE TABLE "MealPlanItem" (
    "mealPlanItemId" SERIAL NOT NULL,
    "mealPlanId" INTEGER NOT NULL,
    "mealType" "MealType" NOT NULL,
    "foodId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "calories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" VARCHAR(255),

    CONSTRAINT "MealPlanItem_pkey" PRIMARY KEY ("mealPlanItemId")
);

-- CreateTable
CREATE TABLE "MealLog" (
    "mealLogId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "logDate" DATE NOT NULL,
    "mealType" "MealType" NOT NULL,
    "caloriesConsumed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proteinConsumed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbsConsumed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatConsumed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("mealLogId")
);

-- CreateTable
CREATE TABLE "MealLogItem" (
    "mealLogItemId" SERIAL NOT NULL,
    "mealLogId" INTEGER NOT NULL,
    "foodId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "calories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "MealLogItem_pkey" PRIMARY KEY ("mealLogItemId")
);

-- CreateTable
CREATE TABLE "Progress" (
    "progressId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,
    "BMI" DOUBLE PRECISION,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("progressId")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "feedbackId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" VARCHAR(255),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedbackId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserInfo_userId_key" ON "UserInfo"("userId");

-- CreateIndex
CREATE INDEX "MealPlan_userId_idx" ON "MealPlan"("userId");

-- CreateIndex
CREATE INDEX "MealPlanItem_mealPlanId_idx" ON "MealPlanItem"("mealPlanId");

-- CreateIndex
CREATE INDEX "MealPlanItem_foodId_idx" ON "MealPlanItem"("foodId");

-- CreateIndex
CREATE INDEX "MealLog_userId_idx" ON "MealLog"("userId");

-- CreateIndex
CREATE INDEX "MealLogItem_mealLogId_idx" ON "MealLogItem"("mealLogId");

-- CreateIndex
CREATE INDEX "MealLogItem_foodId_idx" ON "MealLogItem"("foodId");

-- CreateIndex
CREATE INDEX "Progress_userId_idx" ON "Progress"("userId");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- AddForeignKey
ALTER TABLE "UserInfo" ADD CONSTRAINT "UserInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanItem" ADD CONSTRAINT "MealPlanItem_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("mealPlanId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanItem" ADD CONSTRAINT "MealPlanItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "FoodItem"("foodId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealLogItem" ADD CONSTRAINT "MealLogItem_mealLogId_fkey" FOREIGN KEY ("mealLogId") REFERENCES "MealLog"("mealLogId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealLogItem" ADD CONSTRAINT "MealLogItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "FoodItem"("foodId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
