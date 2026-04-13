const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const {
//  
  listPrices,

} = require("../controllers/priceController");

const router = express.Router();

router.get("/", listPrices);


module.exports = router;
