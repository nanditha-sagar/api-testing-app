const express = require("express");
const router = express.Router();

const { testAPI } = require("../controllers/apiController");

// route to test API
router.post("/test-api", testAPI);

module.exports = router;
