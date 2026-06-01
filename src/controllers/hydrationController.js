const prisma = require("../prisma");

function startOfDay(dateInput) {
  const day = new Date(dateInput);
  day.setHours(0, 0, 0, 0);
  return day;
}

async function getHydration(req, res) {
  const userId = req.user?.userId;
  const { date, from, to } = req.query;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    if (date) {
      const logDate = startOfDay(date);
      const entry = await prisma.hydrationLog.findUnique({
        where: { userId_logDate: { userId, logDate } },
      });
      return res.status(200).json({
        logDate: date,
        liters: entry?.liters ?? 0,
      });
    }

    const where = { userId };
    if (from || to) {
      where.logDate = {};
      if (from) where.logDate.gte = startOfDay(from);
      if (to) where.logDate.lte = startOfDay(to);
    }

    const entries = await prisma.hydrationLog.findMany({
      where,
      orderBy: { logDate: "asc" },
    });
    return res.status(200).json(entries);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function upsertHydration(req, res) {
  const userId = req.user?.userId;
  const { logDate, liters, addLiters } = req.body;
  if (!userId || !logDate) {
    return res.status(400).json({ message: "logDate is required" });
  }

  try {
    const day = startOfDay(logDate);
    const existing = await prisma.hydrationLog.findUnique({
      where: { userId_logDate: { userId, logDate: day } },
    });

    let nextLiters;
    if (addLiters !== undefined && addLiters !== null) {
      nextLiters = Number((existing?.liters ?? 0) + Number(addLiters));
    } else if (liters !== undefined && liters !== null) {
      nextLiters = Number(liters);
    } else {
      return res.status(400).json({ message: "liters or addLiters is required" });
    }

    if (Number.isNaN(nextLiters) || nextLiters < 0) {
      return res.status(400).json({ message: "liters must be a non-negative number" });
    }

    const entry = await prisma.hydrationLog.upsert({
      where: { userId_logDate: { userId, logDate: day } },
      create: { userId, logDate: day, liters: nextLiters },
      update: { liters: nextLiters },
    });

    return res.status(200).json(entry);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

module.exports = { getHydration, upsertHydration };
