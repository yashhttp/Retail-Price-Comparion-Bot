const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const {
  createOrUpdatePrice,
  listPrices,
  getPriceHistory
} = require("../controllers/priceController");

const router = express.Router();

router.get("/", listPrices);
router.get("/history/:productId", getPriceHistory);
router.post("/", authenticate, requireRole("shopkeeper", "admin"), createOrUpdatePrice);

module.exports = router;
