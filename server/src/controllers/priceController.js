const PriceListing = require("../models/PriceListing");
const PriceHistory = require("../models/PriceHistory");
const Notification = require("../models/Notification");
const Shop = require("../models/Shop");
const User = require("../models/User");
const { getIo } = require("../socket");

const createOrUpdatePrice = async (req, res, next) => {
  try {
    const { productId, shopId, price, currency, inStock } = req.body;

    if (!productId || !shopId || price === undefined) {
      return res.status(400).json({ message: "productId, shopId, and price are required" });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    if (req.user.role === "shopkeeper" && shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this shop" });
    }

    const existing = await PriceListing.findOne({ product: productId, shop: shopId });
    const previousPrice = existing ? existing.price : null;

    const listing = await PriceListing.findOneAndUpdate(
      { product: productId, shop: shopId },
      {
        price,
        currency: currency || existing?.currency || "INR",
        inStock: inStock ?? existing?.inStock ?? true,
        lastUpdated: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await PriceHistory.create({
      product: productId,
      shop: shopId,
      price
    });

    // Notification logic for price drops
    console.log(`[Notification Check] Product: ${productId}, Previous: ${previousPrice}, New: ${price}`);
    
    if (previousPrice !== null && price < previousPrice) {
      console.log(`[Price Drop Detected] Previous: ${previousPrice}, New: ${price}`);
      
      const watchers = await User.find({ watchlist: productId }).select("_id");
      console.log(`[Watchers Found] Count: ${watchers.length}`);
      
      if (watchers.length > 0) {
        const notifications = watchers.map((user) => ({
          user: user._id,
          product: productId,
          shop: shopId,
          previousPrice,
          newPrice: price
        }));
        const result = await Notification.insertMany(notifications);
        const createdNotifications = await Notification.find({
          _id: { $in: result.map((item) => item._id) }
        })
          .populate("product")
          .populate("shop");

        const io = getIo();
        if (io) {
          createdNotifications.forEach((notification) => {
            io.to(`user:${notification.user.toString()}`).emit("notification:new", notification);
          });
        }
        console.log(`[Notifications Created] Count: ${result.length}`);
      } else {
        console.log(`[No Watchers] Product ${productId} has no watchers`);
      }
    } else {
      if (previousPrice === null) {
        console.log(`[No Notification] First price entry for product ${productId}`);
      } else if (price >= previousPrice) {
        console.log(`[No Notification] Price increased or unchanged (${previousPrice} -> ${price})`);
      }
    }

    return res.status(existing ? 200 : 201).json({ listing });
  } catch (error) {
    return next(error);
  }
};
const listPrices = async (req, res, next) => {
  try {
    const { productId, shopId } = req.query;
    const filter = {};
    if (productId) {
      filter.product = productId;
    }
    if (shopId) {
      filter.shop = shopId;
    }

    const listings = await PriceListing.find(filter).populate("product").populate("shop");
    return res.json({ listings });
  } catch (error) {
    return next(error);
  }
};
const getPriceHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { shopId } = req.query;
    const filter = { product: productId };
    if (shopId) {
      filter.shop = shopId;
    }

    const history = await PriceHistory.find(filter).sort({ recordedAt: 1 });
    
    // Calculate analytics
    const analytics = calculatePriceAnalytics(history);
    
    return res.json({ history, analytics });
  } catch (error) {
    return next(error);
  }
};


module.exports = { createOrUpdatePrice,listPrices, getPriceHistory};
