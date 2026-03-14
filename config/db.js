const mysql = require("mysql2");

// create connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Vijjus.c01_", 
  database: "api_tester",
});

// connect to database
db.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err);
    return;
  }
  console.log("Connected to MySQL Database");
});

module.exports = db;
