const express = require("express");
const router = express.Router();

const { testAPI, loginUser, saveHistory} = require("../controllers/apiController");

// route to test API
router.post("/test-api", testAPI);

// login route
router.post("/login", loginUser);

router.post("/save-history", saveHistory);

module.exports = router;
