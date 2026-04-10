const Shop = require("../models/Shop");
const User = require("../models/User");
const PriceListing = require("../models/PriceListing");
const {
  getAvailablePaidPlans,
  getEffectiveSubscription,
  getPlanConfig
} = require("../utils/subscription");

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildLimitResponse = ({ resource, usage, limits, currentPlan }) => ({
  code: "SUBSCRIPTION_REQUIRED",
  message: `Your ${currentPlan.name} plan allows ${limits[resource]} ${resource}. Upgrade to continue.`,
  resource,
  usage,
  limits,
  currentPlan: currentPlan.code,
  availablePlans: getAvailablePaidPlans()
});

const getGoogleMapsApiKey = () => {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.GEOCODE_API_KEY || "";
};

const geocodeAddressHelper = async (address) => {
  if (!address) {
    return { latitude: 0, longitude: 0 };
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return { latitude: 0, longitude: 0 };
  }

  try {
    const encoded = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;
    const response = await fetch(url);
    const payload = await response.json();

    if (payload.results && payload.results.length > 0) {
      const { lat, lng } = payload.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  return { latitude: 0, longitude: 0 };
};

const createShop = async (req, res, next) => {
  try {
    const { name, address, phone, latitude, longitude } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Shop name is required" });
    }

    if (req.user.role === "shopkeeper") {
      const freshUser = await User.findById(req.user._id).select("role subscription");
      const subscription = getEffectiveSubscription(freshUser || req.user);
      const currentPlan = getPlanConfig(subscription?.plan);
      const limits = currentPlan.limits;
      const currentShopCount = await Shop.countDocuments({ owner: req.user._id });

      if (typeof limits.shops === "number" && currentShopCount >= limits.shops) {
        return res.status(402).json(
          buildLimitResponse({
            resource: "shops",
            usage: { shops: currentShopCount },
            limits,
            currentPlan
          })
        );
      }
    }

    // If coordinates are not provided, try to geocode the address
    let finalLat = Number(latitude) || 0;
    let finalLng = Number(longitude) || 0;

    if ((finalLat === 0 || finalLng === 0) && address) {
      const geocoded = await geocodeAddressHelper(address);
      finalLat = geocoded.latitude;
      finalLng = geocoded.longitude;
    }

    const shop = await Shop.create({
      name,
      owner: req.user._id,
      address,
      phone,
      location: {
        type: "Point",
        coordinates: [finalLng, finalLat]
      }
    });

    return res.status(201).json({ shop });
  } catch (error) {
    return next(error);
  }
};

const getNearbyShops = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const shops = await Shop.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius)
        }
      }
    });

    return res.json({ shops });
  } catch (error) {
    return next(error);
  }
};

const getMyShops = async (req, res, next) => {
  try {
    const shops = await Shop.find({ owner: req.user._id });
    return res.json({ shops });
  } catch (error) {
    return next(error);
  }
};

const searchShopsWithProducts = async (req, res, next) => {
  try {
    const { name } = req.query;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Shop name is required" });
    }

    const shops = await Shop.find({
      name: { $regex: escapeRegex(name.trim()), $options: "i" }
    })
      .sort({ name: 1 })
      .limit(20);

    if (!shops.length) {
      return res.json({ shops: [] });
    }

    const shopIds = shops.map((shop) => shop._id);
    const listings = await PriceListing.find({ shop: { $in: shopIds } })
      .populate("product", "name brand category")
      .sort({ updatedAt: -1 });

    const listingsByShop = new Map();
    listings.forEach((listing) => {
      const key = listing.shop.toString();
      if (!listingsByShop.has(key)) {
        listingsByShop.set(key, []);
      }

      listingsByShop.get(key).push({
        listingId: listing._id,
        productId: listing.product?._id,
        productName: listing.product?.name || "Unknown product",
        brand: listing.product?.brand || "",
        category: listing.product?.category || "",
        price: listing.price,
        currency: listing.currency || "INR",
        inStock: listing.inStock,
        lastUpdated: listing.lastUpdated || listing.updatedAt
      });
    });

    const result = shops.map((shop) => ({
      id: shop._id,
      name: shop.name,
      address: shop.address,
      phone: shop.phone,
      products: listingsByShop.get(shop._id.toString()) || []
    }));

    return res.json({ shops: result });
  } catch (error) {
    return next(error);
  }
};

const geocodeAddress = async (req, res, next) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ message: "address is required" });
    }

    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      return res.status(400).json({ message: "Google Maps API key is not configured" });
    }

    const encoded = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;
    const response = await fetch(url);
    const payload = await response.json();

    if (!payload.results || payload.results.length === 0) {
      return res.status(404).json({ message: "No geocoding results" });
    }

    const { lat, lng } = payload.results[0].geometry.location;
    return res.json({ location: { lat, lng } });
  } catch (error) {
    return next(error);
  }
};

const deleteShop = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own shops" });
    }

    await Shop.findByIdAndDelete(shopId);
    return res.json({ message: "Shop deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const updateShopLocation = async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own shops" });
    }

    if (!shop.address) {
      return res.status(400).json({ message: "Shop must have an address to geocode" });
    }

    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      return res.status(400).json({ message: "Google Maps API is not configured. Contact admin." });
    }

    const encoded = encodeURIComponent(shop.address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;
    const response = await fetch(url);
    const payload = await response.json();

    if (!payload.results || payload.results.length === 0) {
      return res.status(404).json({ message: "Could not find location for this address" });
    }

    const { lat, lng } = payload.results[0].geometry.location;
    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      {
        location: {
          type: "Point",
          coordinates: [lng, lat]
        }
      },
      { new: true }
    );

    return res.json({ shop: updatedShop, message: "Location updated successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createShop,
  getNearbyShops,
  getMyShops,
  searchShopsWithProducts,
  geocodeAddress,
  updateShopLocation,
  deleteShop
};
