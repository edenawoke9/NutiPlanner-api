const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper function to validate input
function validateFeedbackInput(comment, rating) {
  const errors = [];

  if (!comment || comment.trim().length === 0) {
    errors.push("Comment cannot be empty.");
  }

  if (rating !== undefined) {
    if (typeof rating !== "number") {
      errors.push("Rating must be a number.");
    } else if (rating < 1 || rating > 5) {
      errors.push("Rating must be between 1 and 5.");
    }
  }

  return errors;
}

async function createFeedback(req, res) {
  try {

    const { comment, rating } = req.body;
    const userId = req.user.userId;

    // Validate input
    const errors = validateFeedbackInput(comment, rating);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const feedback = await prisma.feedback.create({
      data: {
        comment,
        rating,
        userId
      }
    });

    res.status(201).json({
      message: "Feedback submitted successfully.",
      feedback
    });

  } catch (error) {
    console.error("ERROR:", error);

    // Check if it's a Prisma validation/database error
    if (error.code && error.code.startsWith("P")) {
      return res.status(400).json({ error: "Database validation error", details: error.meta });
    }

    res.status(500).json({ error: "Internal server error. Please try again later." });
  }
}

async function getMyFeedback(req, res) {
  try {
    const userId = req.user.userId;

    const feedback = await prisma.feedback.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" }
    });

    res.json({ feedback, count: feedback.length });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
}

module.exports = {
  createFeedback,
  getMyFeedback
};