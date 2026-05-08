const prisma = require("../prisma");

async function submitFeedback(req, res) {
  const userId = req.user?.userId;
  const { rating, comment } = req.body;
  const numericRating = Number(rating);

  if (!userId || Number.isNaN(numericRating)) {
    return res.status(400).json({ message: "rating is required" });
  }

  if (numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: "rating must be between 1 and 5" });
  }

  try {
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        rating: numericRating,
        ...(comment ? { comment } : {}),
      },
    });
    return res.status(201).json(feedback);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function getMyFeedback(req, res) {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const feedback = await prisma.feedback.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
    });
    return res.status(200).json(feedback);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function getAllFeedback(req, res) {
  const { userId, rating, from } = req.query;

  try {
    const where = {
      ...(userId ? { userId: Number(userId) } : {}),
      ...(rating ? { rating: Number(rating) } : {}),
      ...(from ? { submittedAt: { gte: new Date(from) } } : {}),
    };

    const feedback = await prisma.feedback.findMany({
      where,
      include: {
        user: {
          select: { userId: true, username: true, email: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
    return res.status(200).json(feedback);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function deleteFeedback(req, res) {
  const feedbackId = Number(req.params.feedbackId);
  if (Number.isNaN(feedbackId)) {
    return res.status(400).json({ message: "Invalid feedbackId" });
  }

  try {
    await prisma.feedback.delete({ where: { feedbackId } });
    return res.status(200).json({ message: "Feedback deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

module.exports = {
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
  deleteFeedback,
};
