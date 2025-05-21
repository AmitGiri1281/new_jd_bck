const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/contact', (req, res) => {
  const { name, email, phone, course_complated, course_intersted, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = 'INSERT INTO contacts (name, email, phone, course_complated, course_intersted, message) VALUES (?, ?, ?, ?, ?, ?)';
  const values = [name, email, phone, course_complated, course_intersted, message];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Database insert error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    return res.json({ message: 'Message sent successfully!' });
  });
});


module.exports = router;
