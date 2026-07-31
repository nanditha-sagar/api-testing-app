const express = require("express");
const router = express.Router();

const {
  testAPI,
  registerUser,
  loginUser,
  saveHistory,
  getHistory,
  clearUserHistory,
  saveRequest,
  getSavedRequests,
  deleteSavedRequest
} = require("../controllers/apiController");

// route to test API
router.post("/test-api", testAPI);

// register route
router.post("/register", registerUser);

// login route
router.post("/login", loginUser);

// history routes
router.post("/save-history", saveHistory);
router.get("/history/:email", getHistory);
router.delete("/history/:email", clearUserHistory);

// saved requests routes
router.post("/saved-requests", saveRequest);
router.get("/saved-requests/:email", getSavedRequests);
router.delete("/saved-requests/:id", deleteSavedRequest);

module.exports = router;
