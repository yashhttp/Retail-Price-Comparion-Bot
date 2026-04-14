const express = require("express");
const { chatbotQuery } = require("../controllers/chatbotController");

const router = express.Router();

router.post("/query", chatbotQuery);

module.exports = router;

