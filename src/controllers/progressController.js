const prisma = require("../prisma");

async function addProgress(req, res) {
  const userId = req.user?.userId;
  const { weight, BMI, date } = req.body;

  if (!userId || !date) {
    return res.status(400).json({ message: "date is required" });
  }

  try {
    let derivedBMI = BMI;
    if (weight !== undefined && (BMI === undefined || BMI === null)) {
      const userInfo = await prisma.userInfo.findUnique({ where: { userId } });
      if (userInfo?.height) {
        const heightInMeters = Number(userInfo.height) / 100;
        if (heightInMeters > 0) {
          derivedBMI = Number(weight) / (heightInMeters * heightInMeters);
        }
      }
    }

    const progress = await prisma.progress.create({
      data: {
        userId,
        ...(weight !== undefined ? { weight: Number(weight) } : {}),
        ...(derivedBMI !== undefined && derivedBMI !== null ? { BMI: Number(derivedBMI) } : {}),
        date: new Date(date),
      },
    });
    return res.status(201).json(progress);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function getProgress(req, res) {
  const userId = req.user?.userId;
  const { from, to } = req.query;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const where = { userId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const data = await prisma.progress.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function getProgressSummary(req, res) {
  const userId = req.user?.userId;
  const { date } = req.query;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!date) return res.status(400).json({ message: "date query parameter is required" });

  try {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [mealLogs, dailyPlan, progressSeries] = await Promise.all([
      prisma.mealLog.findMany({
        where: {
          userId,
          logDate: { gte: dayStart, lte: dayEnd },
        },
      }),
      prisma.mealPlan.findFirst({
        where: {
          userId,
          planDate: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.progress.findMany({
        where: { userId },
        orderBy: { date: "asc" },
      }),
    ]);

    const caloriesConsumed = mealLogs.reduce((sum, entry) => sum + (entry.caloriesConsumed || 0), 0);
    const proteinConsumed = mealLogs.reduce((sum, entry) => sum + (entry.proteinConsumed || 0), 0);
    const carbsConsumed = mealLogs.reduce((sum, entry) => sum + (entry.carbsConsumed || 0), 0);
    const fatConsumed = mealLogs.reduce((sum, entry) => sum + (entry.fatConsumed || 0), 0);

    const calorieGoal = dailyPlan?.calorieGoal || 0;
    const adherencePct = calorieGoal > 0 ? (caloriesConsumed / calorieGoal) * 100 : null;

    const trends = {
      weight: progressSeries
        .filter((item) => item.weight !== null)
        .map((item) => ({ date: item.date, value: item.weight })),
      bmi: progressSeries
        .filter((item) => item.BMI !== null)
        .map((item) => ({ date: item.date, value: item.BMI })),
    };

    return res.status(200).json({
      date,
      totalMeals: mealLogs.length,
      caloriesConsumed,
      proteinConsumed,
      carbsConsumed,
      fatConsumed,
      calorieGoal,
      adherencePct,
      trends,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

module.exports = {
  addProgress,
  getProgress,
  getProgressSummary,
};
