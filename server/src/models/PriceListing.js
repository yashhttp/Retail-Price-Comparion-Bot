const mongoose = require("mongoose");

const priceListingSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    inStock: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

priceListingSchema.index({ product: 1, shop: 1 }, { unique: true });

module.exports = mongoose.model("PriceListing", priceListingSchema);
