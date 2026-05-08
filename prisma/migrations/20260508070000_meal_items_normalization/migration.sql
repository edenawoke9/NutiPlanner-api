-- AlterTable
ALTER TABLE `UserInfo`
    ADD COLUMN `activityLevel` DOUBLE NULL DEFAULT 1.2,
    ADD COLUMN `allergies` VARCHAR(255) NULL,
    ADD COLUMN `dislikes` VARCHAR(255) NULL,
    ADD COLUMN `dietaryPreferences` VARCHAR(255) NULL;

-- DropForeignKey
ALTER TABLE `MealPlan` DROP FOREIGN KEY `MealPlan_foodId_fkey`;

-- DropIndex
DROP INDEX `MealPlan_foodId_idx` ON `MealPlan`;

-- AlterTable
ALTER TABLE `MealPlan`
    DROP COLUMN `foodId`,
    DROP COLUMN `mealType`,
    DROP COLUMN `breakfast`,
    DROP COLUMN `lunch`,
    DROP COLUMN `dinner`,
    DROP COLUMN `snack`,
    ADD COLUMN `proteinGoal` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `carbsGoal` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `fatGoal` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `generatedBy` VARCHAR(30) NULL,
    ADD COLUMN `notes` VARCHAR(255) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- DropForeignKey
ALTER TABLE `MealLog` DROP FOREIGN KEY `MealLog_foodId_fkey`;

-- DropIndex
DROP INDEX `MealLog_foodId_idx` ON `MealLog`;

-- AlterTable
ALTER TABLE `MealLog`
    DROP COLUMN `foodId`,
    MODIFY COLUMN `caloriesConsumed` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `proteinConsumed` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `carbsConsumed` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `fatConsumed` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `notes` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `MealPlanItem` (
    `mealPlanItemId` INTEGER NOT NULL AUTO_INCREMENT,
    `mealPlanId` INTEGER NOT NULL,
    `mealType` ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    `foodId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 1,
    `calories` DOUBLE NOT NULL DEFAULT 0,
    `protein` DOUBLE NOT NULL DEFAULT 0,
    `carbs` DOUBLE NOT NULL DEFAULT 0,
    `fat` DOUBLE NOT NULL DEFAULT 0,
    `notes` VARCHAR(255) NULL,
    INDEX `MealPlanItem_mealPlanId_idx`(`mealPlanId`),
    INDEX `MealPlanItem_foodId_idx`(`foodId`),
    PRIMARY KEY (`mealPlanItemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MealLogItem` (
    `mealLogItemId` INTEGER NOT NULL AUTO_INCREMENT,
    `mealLogId` INTEGER NOT NULL,
    `foodId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 1,
    `calories` DOUBLE NOT NULL DEFAULT 0,
    `protein` DOUBLE NOT NULL DEFAULT 0,
    `carbs` DOUBLE NOT NULL DEFAULT 0,
    `fat` DOUBLE NOT NULL DEFAULT 0,
    INDEX `MealLogItem_mealLogId_idx`(`mealLogId`),
    INDEX `MealLogItem_foodId_idx`(`foodId`),
    PRIMARY KEY (`mealLogItemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MealPlanItem`
    ADD CONSTRAINT `MealPlanItem_mealPlanId_fkey`
    FOREIGN KEY (`mealPlanId`) REFERENCES `MealPlan`(`mealPlanId`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealPlanItem`
    ADD CONSTRAINT `MealPlanItem_foodId_fkey`
    FOREIGN KEY (`foodId`) REFERENCES `FoodItem`(`foodId`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealLogItem`
    ADD CONSTRAINT `MealLogItem_mealLogId_fkey`
    FOREIGN KEY (`mealLogId`) REFERENCES `MealLog`(`mealLogId`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealLogItem`
    ADD CONSTRAINT `MealLogItem_foodId_fkey`
    FOREIGN KEY (`foodId`) REFERENCES `FoodItem`(`foodId`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
