
const mongoose = require("mongoose");
require("dotenv").config();

const mongoURI = process.env.MONGODB_URI
  ?.trim()
  .replace(/^"|"$/g, "");

if (!mongoURI) {
  console.error("❌ MONGODB_URI is missing from .env");
  process.exit(1);
}
// console.log("MongoDB URI loaded:", Boolean(mongoURI));
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

module.exports = mongoose;
