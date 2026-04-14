const Product = require("../models/Product");
const Shop = require("../models/Shop");
const PriceListing = require("../models/PriceListing");

const extractQuery = (question) => {
  const tokens = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

  return tokens.join(" ").trim();
};

const chatbotQuery = async (req, res, next) => {
  try {
    const { question, lat, lng, radius = 5000 } = req.body;
    if (!question) {
      return res.status(400).json({ message: "question is required" });
    }

    const cleaned = extractQuery(question);
    if (!cleaned) {
      return res.json({ answer: "Try asking about a specific product name." });
    }

    const product = await Product.findOne({
  $text: { $search: cleaned }
});

    if (!product) {
      return res.json({ answer: "I could not find that product nearby." });
    }

    let shopFilter = null;
    if (lat && lng) {
      const nearby = await Shop.find({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
            $maxDistance: Number(radius)
          }
        }
      });

      shopFilter = { $in: nearby.map((shop) => shop._id) };
    }

    const listingQuery = { product: product._id };
    if (shopFilter) {
      listingQuery.shop = shopFilter;
    }

    const listing = await PriceListing.findOne(listingQuery).sort({ price: 1 }).populate("shop");

    if (!listing) {
      return res.json({ answer: "No price listings found for that product." });
    }

    const answer = `Best price for ${product.name} is ${listing.price} ${listing.currency} at ${listing.shop.name}.`;
    return res.json({ answer, listing, product });
  } catch (error) {
    return next(error);
  }
};

module.exports = { chatbotQuery };