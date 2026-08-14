const axios = require("axios");
const User = require("../models/User");
const ApiHistory = require("../models/ApiHistory");
const SavedRequest = require("../models/SavedRequest");
const { generateInsights } = require("../services/aiService");

const crypto = require("crypto");

// Hash password helper
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// Verify password helper
function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(":")) {
    return false;
  }
  const [salt, hash] = storedPassword.split(":");
  const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === testHash;
}

// API testing controller
const testAPI = async (req, res) => {
  const { url, method, body, headers } = req.body;

  try {
    const response = await axios({
      url,
      method,
      data: body,
      headers: headers || {},
      validateStatus: () => true
    });

    res.json({
      status: response.status,
      data: response.data,
      headers: response.headers
    });
  } catch (error) {
    res.status(500).json({
      message: "API request failed",
      error: error.message,
    });
  }
};

// register controller

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = hashPassword(password);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
};

// login controller
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    res.json({
        message: "Login successful",
        user: {
          name: user.name,
          email: user.email
        }
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

// save history
const saveHistory = async (req, res) => {
  const { email, method, url, headers, body, status, time } = req.body;

  try {
    const history = new ApiHistory({
      user_email: email,
      method,
      url,
      headers: headers || null,
      request_body: body,
      status_code: status,
      response_time: time
    });
    await history.save();
    res.json({ message: "History stored successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
};

// get user history
const getHistory = async (req, res) => {
  const { email } = req.params;

  try {
    const histories = await ApiHistory.find({ user_email: email })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(histories);
  } catch (error) {
    res.status(500).json(error);
  }
};

// clear user history
const clearUserHistory = async (req, res) => {
  const { email } = req.params;

  try {
    await ApiHistory.deleteMany({ user_email: email });
    res.json({ message: "History cleared successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
};

// save a request
const saveRequest = async (req, res) => {
  const { email, name, method, url, headers, body } = req.body;

  if (!email || !name || !method || !url) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const saved = new SavedRequest({
      user_email: email,
      name,
      method,
      url,
      headers: headers || null,
      request_body: body
    });
    await saved.save();
    res.json({ message: "Request saved successfully", id: saved._id });
  } catch (error) {
    res.status(500).json(error);
  }
};

// get saved requests
const getSavedRequests = async (req, res) => {
  const { email } = req.params;

  try {
    const savedRequests = await SavedRequest.find({ user_email: email })
      .sort({ createdAt: -1 });
    res.json(savedRequests);
  } catch (error) {
    res.status(500).json(error);
  }
};

// delete saved request
const deleteSavedRequest = async (req, res) => {
  const { id } = req.params;

  try {
    await SavedRequest.findByIdAndDelete(id);
    res.json({ message: "Saved request deleted successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
};

// AI Insights controller — powered by LangChain.js + Groq
const generateAIInsights = async (req, res) => {
  const { method, url, headers, body, status, response_data, error_message, mode } = req.body;

  if (!method || !url) {
    return res.status(400).json({ message: "method and url are required" });
  }

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "your_groq_api_key_here") {
    return res.status(503).json({
      message: "GROQ_API_KEY is not configured. Add your key to .env and restart the server."
    });
  }

  try {
    const result = await generateInsights(
      { method, url, headers, body, status, response_data, error_message },
      mode || "all"
    );
    res.json(result);
  } catch (error) {
    console.error("[AI] LangChain error:", error.message);
    res.status(500).json({ message: "AI generation failed", error: error.message });
  }
};

module.exports = {
  testAPI,
  registerUser,
  loginUser,
  saveHistory,
  getHistory,
  clearUserHistory,
  saveRequest,
  getSavedRequests,
  deleteSavedRequest,
  generateAIInsights
}
