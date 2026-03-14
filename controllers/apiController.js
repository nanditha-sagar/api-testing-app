const axios = require("axios");
const db = require("../config/db");

// API testing controller
const testAPI = async (req, res) => {
  const { url, method, body } = req.body;

  try {
    const response = await axios({
      url,
      method,
      data: body,
    });

    res.json({
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      message: "API request failed",
      error: error.message,
    });
  }
};

// login controller
const loginUser = (req, res) => {
  const { name, email } = req.body;

  const checkUser = "SELECT * FROM users WHERE email = ?";

  db.query(checkUser, [email], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (result.length > 0) {
      return res.json({ message: "User already exists" });
    }

    const insertUser = "INSERT INTO users (name,email) VALUES (?,?)";

    db.query(insertUser, [name, email], (err, data) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({ message: "User registered successfully" });
    });
  });
};
const saveHistory = (req, res) => {
  const { email, method, url, body, status, time } = req.body;

  const sql = `
INSERT INTO api_history
(user_email, method, url, request_body, status_code, response_time)
VALUES (?, ?, ?, ?, ?, ?)
`;

  db.query(sql, [email, method, url, body, status, time], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({ message: "History stored successfully" });
  });
};

module.exports = {
  testAPI,
  loginUser,
  saveHistory
};
