const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "./.env" });

const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Shop = require("../src/models/Shop");
const PriceListing = require("../src/models/PriceListing");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data (optional)
    // await User.deleteMany({});
    // await Product.deleteMany({});
    // await Shop.deleteMany({});
    // await PriceListing.deleteMany({});

    // Create a shopkeeper
    const passwordHash = await bcrypt.hash("password123", 10);
    let shopkeeper = await User.findOne({ email: "shopkeeper@example.com" });
    if (!shopkeeper) {
      shopkeeper = await User.create({
        name: "John Shopkeeper",
        email: "shopkeeper@example.com",
        passwordHash,
        role: "shopkeeper",
        subscription: { plan: "premium", status: "active" }
      });
      console.log("Created shopkeeper");
    }

    // Create a shop
    let shop = await Shop.findOne({ name: "Local Mart" });
    if (!shop) {
      shop = await Shop.create({
        name: "Local Mart",
        owner: shopkeeper._id,
        address: "123 Main St, New York, NY",
        location: { type: "Point", coordinates: [-74.006, 40.7128] }
      });
      console.log("Created shop");
    }

    // Create a product
    let product = await Product.findOne({ name: "Milk" });
    if (!product) {
      product = await Product.create({
        name: "Milk",
        brand: "Dairy Fresh",
        category: "Groceries",
        owner: shopkeeper._id
      });
      console.log("Created product");
    }

    // Create a price listing
    let listing = await PriceListing.findOne({ product: product._id, shop: shop._id });
    if (!listing) {
      listing = await PriceListing.create({
        product: product._id,
        shop: shop._id,
        price: 3.5,
        currency: "USD",
        inStock: true
      });
      console.log("Created price listing");
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();
