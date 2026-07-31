const axios = require("axios");
const db = require("../config/db");

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
const registerUser = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const checkUser = "SELECT * FROM users WHERE email = ?";

  db.query(checkUser, [email], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (result.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = hashPassword(password);
    const insertUser = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(insertUser, [name, email, hashedPassword], (err, data) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({ message: "User registered successfully" });
    });
  });
};

// login controller
const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const checkUser = "SELECT * FROM users WHERE email = ?";

  db.query(checkUser, [email], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (result.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = result[0];
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
  });
};

// save history
const saveHistory = (req, res) => {
  const { email, method, url, headers, body, status, time } = req.body;

  const sql = `
INSERT INTO api_history
(user_email, method, url, headers, request_body, status_code, response_time)
VALUES (?, ?, ?, ?, ?, ?, ?)
`;

  db.query(sql, [email, method, url, headers ? JSON.stringify(headers) : null, body, status, time], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({ message: "History stored successfully" });
  });
};

// get user history
const getHistory = (req, res) => {
  const { email } = req.params;

  const sql = "SELECT * FROM api_history WHERE user_email = ? ORDER BY created_at DESC LIMIT 50";
  db.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(results);
  });
};

// clear user history
const clearUserHistory = (req, res) => {
  const { email } = req.params;

  const sql = "DELETE FROM api_history WHERE user_email = ?";
  db.query(sql, [email], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json({ message: "History cleared successfully" });
  });
};

// save a request
const saveRequest = (req, res) => {
  const { email, name, method, url, headers, body } = req.body;

  if (!email || !name || !method || !url) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const sql = `
INSERT INTO saved_requests (user_email, name, method, url, headers, request_body)
VALUES (?, ?, ?, ?, ?, ?)
`;

  db.query(sql, [email, name, method, url, headers ? JSON.stringify(headers) : null, body], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json({ message: "Request saved successfully", id: result.insertId });
  });
};

// get saved requests
const getSavedRequests = (req, res) => {
  const { email } = req.params;

  const sql = "SELECT * FROM saved_requests WHERE user_email = ? ORDER BY created_at DESC";
  db.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(results);
  });
};

// delete saved request
const deleteSavedRequest = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM saved_requests WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json({ message: "Saved request deleted successfully" });
  });
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
  deleteSavedRequest
};
