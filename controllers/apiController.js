const axios = require("axios");
const db = require("../config/db");

const testAPI = async (req, res) => {
  const { url, method, body } = req.body;

  const startTime = Date.now();

  try {
    const response = await axios({
      url: url,
      method: method,
      data: body,
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const statusCode = response.status;

    // store request history in database
    const query = `
            INSERT INTO api_history (url, method, status_code, response_time)
            VALUES (?, ?, ?, ?)
        `;

    // db.query(query, [url, method, statusCode, responseTime], (err) => {
    //   if (err) {
    //     console.log("Database insert error:", err);
    //   }
    // });

    res.json({
      status: statusCode,
      time: responseTime,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      message: "API request failed",
      error: error.message,
    });
  }
};

module.exports = {
  testAPI,
};
