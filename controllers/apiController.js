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

  const sql = "INSERT INTO users (name,email) VALUES (?,?)";

  db.query(sql, [name, email], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({ message: "User stored successfully" });
  });
};

module.exports = {
  testAPI,
  loginUser,
};
