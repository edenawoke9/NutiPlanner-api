const prisma = require("../prisma");

async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      include: { userInfo: true },
      orderBy: { createdAt: "desc" },
    });

    const safeUsers = users.map(({ password, ...user }) => user);
    return res.status(200).json(safeUsers);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function deleteUserAsAdmin(req, res) {
  const userId = Number(req.params.userId);
  if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });

  try {
    await prisma.user.delete({ where: { userId } });
    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function updateUserAsAdmin(req, res) {
  const userId = Number(req.params.userId);
  const { username, email, role } = req.body;
  if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });

  try {
    const updated = await prisma.user.update({
      where: { userId },
      data: {
        ...(username !== undefined ? { username } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(role !== undefined ? { role } : {}),
      },
    });
    const { password, ...safeUser } = updated;
    return res.status(200).json(safeUser);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function getAdminReport(req, res) {
  try {
    const [
      users,
      foods,
      mealPlans,
      mealLogs,
      feedbacks,
      progresses,
      mealLogsByType,
      feedbackByRating,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.foodItem.count(),
      prisma.mealPlan.count(),
      prisma.mealLog.count(),
      prisma.feedback.count(),
      prisma.progress.count(),
      prisma.mealLog.groupBy({
        by: ["mealType"],
        _count: { mealType: true },
      }),
      prisma.feedback.groupBy({
        by: ["rating"],
        _count: { rating: true },
      }),
    ]);

    return res.status(200).json({
      users,
      foods,
      mealPlans,
      mealLogs,
      feedbacks,
      progresses,
      mealLogsByType,
      feedbackByRating,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

module.exports = {
  listUsers,
  updateUserAsAdmin,
  deleteUserAsAdmin,
  getAdminReport,
};
