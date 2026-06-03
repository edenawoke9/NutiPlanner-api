const prisma = require("../prisma");
const bcrypt = require("bcryptjs");

const NUTRITIONIST_ROLE = "nutritionist";

function parseUserId(value) {
  const userId = parseInt(value, 10);
  return Number.isNaN(userId) ? null : userId;
}

function toNutritionistResponse(user) {
  if (!user) return user;
  const { password, username, ...rest } = user;
  return {
    userId: rest.userId,
    name: username,
    email: rest.email,
    role: rest.role,
    createdAt: rest.createdAt,
  };
}

function isUniqueConstraintError(error) {
  return error?.code === "P2002";
}

async function listNutritionists(req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { role: NUTRITIONIST_ROLE },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(users.map(toNutritionistResponse));
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function getNutritionistById(req, res) {
  const userId = parseUserId(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Invalid userId" });

  try {
    const user = await prisma.user.findFirst({
      where: { userId, role: NUTRITIONIST_ROLE },
    });
    if (!user) return res.status(404).json({ message: "Nutritionist not found" });
    return res.status(200).json(toNutritionistResponse(user));
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function createNutritionist(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  try {
    const user = await prisma.user.create({
      data: {
        username: name,
        email,
        password: await bcrypt.hash(password, 10),
        role: NUTRITIONIST_ROLE,
      },
    });
    return res.status(201).json(toNutritionistResponse(user));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({ message: "Email or name already in use" });
    }
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function updateNutritionist(req, res) {
  const userId = parseUserId(req.params.userId);
  const { name, email, password } = req.body;
  if (!userId) return res.status(400).json({ message: "Invalid userId" });

  try {
    const existing = await prisma.user.findFirst({
      where: { userId, role: NUTRITIONIST_ROLE },
    });
    if (!existing) return res.status(404).json({ message: "Nutritionist not found" });

    const updated = await prisma.user.update({
      where: { userId },
      data: {
        ...(name !== undefined ? { username: name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(password !== undefined ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });
    return res.status(200).json(toNutritionistResponse(updated));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({ message: "Email or name already in use" });
    }
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function deleteNutritionist(req, res) {
  const userId = parseUserId(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Invalid userId" });

  try {
    const existing = await prisma.user.findFirst({
      where: { userId, role: NUTRITIONIST_ROLE },
    });
    if (!existing) return res.status(404).json({ message: "Nutritionist not found" });

    await prisma.user.delete({ where: { userId } });
    return res.status(200).json({ message: "Nutritionist deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

module.exports = {
  listNutritionists,
  getNutritionistById,
  createNutritionist,
  updateNutritionist,
  deleteNutritionist,
};
