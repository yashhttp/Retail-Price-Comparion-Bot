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

const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate({ _id: id, user: req.user._id }, { read: true });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
module.exports = { listNotifications, markRead };
