const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { createToken } = require("../utils/jwt");
const { DEFAULT_SHOPKEEPER_PLAN, getEffectiveSubscription } = require("../utils/subscription");

const buildAuthUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  subscription: getEffectiveSubscription(user)
});

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const allowedRoles = ["customer", "shopkeeper"];
    const nextRole = allowedRoles.includes(role) ? role : "customer";

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: nextRole,
      subscription:
        nextRole === "shopkeeper"
          ? {
              plan: DEFAULT_SHOPKEEPER_PLAN,
              status: "active",
              startedAt: new Date()
            }
          : undefined
    });

    const token = createToken(user);
    return res.status(201).json({
      token,
      user: buildAuthUserPayload(user)
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(user);
    return res.json({
      token,
      user: buildAuthUserPayload(user)
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { register, login };
