const { PrismaClient } = require("@prisma/client");
const { loadFoodCsv } = require("../src/services/mealPlanning/foodCsv");

const prisma = new PrismaClient();

async function main() {
  const rows = loadFoodCsv();
  const seen = new Set();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const foodName = row.Food?.trim();
    if (!foodName) continue;

    if (seen.has(foodName)) {
      skipped += 1;
      continue;
    }
    seen.add(foodName);

    const data = {
      foodName,
      foodCalories: row.Calories_kcal ?? 0,
      foodProtein: row.Protein_g ?? 0,
      carbs: row.Carbs_g ?? 0,
      fat: row.Fat_g ?? 0,
      category: row.Category || null,
    };

    const existing = await prisma.foodItem.findFirst({
      where: { foodName },
    });

    if (existing) {
      await prisma.foodItem.update({
        where: { foodId: existing.foodId },
        data,
      });
      updated += 1;
    } else {
      await prisma.foodItem.create({ data });
      created += 1;
    }
  }

  console.log(
    `Seed complete: ${created} created, ${updated} updated, ${skipped} duplicate rows skipped`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
