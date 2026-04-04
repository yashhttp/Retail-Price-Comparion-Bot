const mongoose = require("mongoose");

const priceHistorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    price: { type: Number, required: true },
    recordedAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

module.exports = mongoose.model("PriceHistory", priceHistorySchema);
