const PriceListing = require("../models/PriceListing");
const PriceHistory = require("../models/PriceHistory");
const Notification = require("../models/Notification");
const Shop = require("../models/Shop");
const User = require("../models/User");
const { getIo } = require("../socket");


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



module.exports = { listPrices };
