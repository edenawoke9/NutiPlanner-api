-- FoodItem.category was added to schema after some databases were already migrated.
ALTER TABLE "FoodItem" ADD COLUMN IF NOT EXISTS "category" VARCHAR(50);
