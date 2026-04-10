const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const {
  createShop,
  getNearbyShops,
  getMyShops,
  searchShopsWithProducts,
  geocodeAddress,
  updateShopLocation,
  deleteShop
} = require("../controllers/shopController");

const router = express.Router();

router.get("/nearby", getNearbyShops);
router.get("/search", searchShopsWithProducts);
router.get("/geocode", geocodeAddress);
router.get("/mine", authenticate, requireRole("shopkeeper", "admin"), getMyShops);
router.post("/", authenticate, requireRole("shopkeeper", "admin"), createShop);
router.patch("/:shopId/location", authenticate, requireRole("shopkeeper", "admin"), updateShopLocation);
router.delete("/:shopId", authenticate, requireRole("shopkeeper", "admin"), deleteShop);

module.exports = router;
