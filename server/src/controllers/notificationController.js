const Notification = require("../models/Notification");

const listNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("product")
      .populate("shop");

    return res.json({ notifications });
  } catch (error) {
    return next(error);
  }
};


module.exports = { listNotifications };
