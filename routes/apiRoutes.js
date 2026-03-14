const express = require("express");
const router = express.Router();

const { testAPI, loginUser } = require("../controllers/apiController");

// route to test API
router.post("/test-api", testAPI);

// login route
router.post("/login", loginUser);

module.exports = router;
