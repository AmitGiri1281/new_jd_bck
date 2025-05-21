const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // your MySQL user
  password: 'Gutwan@123',  // your MySQL password
  database: 'jd_education_login' // your DB name
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection failed:', err);
    process.exit(1);
  } else {
    console.log('Connected to MySQL database.');
  }
});

module.exports = db;
