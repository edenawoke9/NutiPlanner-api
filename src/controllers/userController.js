const prisma = require("../prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

function parseUserId(value) {
  const userId = parseInt(value, 10);
  return Number.isNaN(userId) ? null : userId;
}

function sanitizeUser(user) {
  if (!user) return user;
  const { password, ...safeUser } = user;
  return safeUser;
}

function createAuthToken(user) {
  return jwt.sign({ userId: user.userId, role: user.role }, SECRET_KEY, {
    expiresIn: "7d",
  });
}

async function getUserById(req, res) {
  const userId = parseUserId(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Invalid userId" });

  try {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: { userInfo: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function createUser(req, res) {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "username, email and password are required" });
  }

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: await bcrypt.hash(password, 10),
        ...(role ? { role } : {}),
      },
    });
    const token = createAuthToken(user);

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid password" });

    const token = createAuthToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function updateUserInfo(req, res) {
  const userId = parseUserId(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Invalid userId" });

  const {
    fullName,
    weight,
    height,
    age,
    gender,
    healthGoal,
    activityLevel,
    allergies,
    dislikes,
    dietaryPreferences,
  } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const response = await prisma.user.update({
      where: { userId },
      data: {
        userInfo: {
          upsert: {
            create: {
              fullName,
              ...(weight !== undefined ? { weight: Number(weight) } : {}),
              ...(height !== undefined ? { height: Number(height) } : {}),
              ...(age !== undefined ? { age: Number(age) } : {}),
              ...(gender !== undefined ? { gender } : {}),
              ...(healthGoal !== undefined ? { healthGoal } : {}),
              ...(activityLevel !== undefined ? { activityLevel: Number(activityLevel) } : {}),
              ...(allergies !== undefined ? { allergies } : {}),
              ...(dislikes !== undefined ? { dislikes } : {}),
              ...(dietaryPreferences !== undefined ? { dietaryPreferences } : {}),
            },
            update: {
              ...(fullName !== undefined ? { fullName } : {}),
              ...(weight !== undefined ? { weight: Number(weight) } : {}),
              ...(height !== undefined ? { height: Number(height) } : {}),
              ...(age !== undefined ? { age: Number(age) } : {}),
              ...(gender !== undefined ? { gender } : {}),
              ...(healthGoal !== undefined ? { healthGoal } : {}),
              ...(activityLevel !== undefined ? { activityLevel: Number(activityLevel) } : {}),
              ...(allergies !== undefined ? { allergies } : {}),
              ...(dislikes !== undefined ? { dislikes } : {}),
              ...(dietaryPreferences !== undefined ? { dietaryPreferences } : {}),
            },
          },
        },
      },
      include: { userInfo: true },
    });

    return res.status(200).json({ message: "User info updated", data: sanitizeUser(response) });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function updateUser(req, res) {
  const userId = parseUserId(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Invalid userId" });

  const { username, email, role, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const response = await prisma.user.update({
      where: { userId },
      data: {
        ...(username !== undefined ? { username } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });

    return res.status(200).json({ message: "User updated", data: sanitizeUser(response) });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

async function deleteUser(req, res) {
  const userId = parseUserId(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Invalid userId" });

  try {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    await prisma.user.delete({ where: { userId } });
    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

module.exports = { getUserById, createUser, loginUser, updateUserInfo, deleteUser, updateUser };
