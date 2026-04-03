const jwt = require("jsonwebtoken");
const User = require("../models/User");

const PRESENCE_UPDATE_INTERVAL_MS = 60 * 1000;

const getTokenFromHeader = (header = "") =>
  header.startsWith("Bearer ") ? header.slice(7) : null;

const maybeUpdatePresence = (user) => {
  if (!user?._id) {
    return;
  }

  const lastSeenTime = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
  if (Date.now() - lastSeenTime < PRESENCE_UPDATE_INTERVAL_MS) {
    return;
  }

  User.findByIdAndUpdate(user._id, { lastSeenAt: new Date() }).catch(() => {
    // Presence updates should never fail the request.
  });
};

const authenticate = async (req, res, next) => {
  const token = getTokenFromHeader(req.headers.authorization || "");

  if (!token) {
    return res.status(401).json({ message: "Authorization required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    maybeUpdatePresence(user);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const optionalAuthenticate = async (req, _res, next) => {
  const token = getTokenFromHeader(req.headers.authorization || "");

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (user) {
      req.user = user;
      maybeUpdatePresence(user);
    }
  } catch (_error) {
    // Ignore invalid optional auth and continue as anonymous.
  }

  return next();
};

module.exports = { authenticate, optionalAuthenticate };
