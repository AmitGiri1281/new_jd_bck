// const express = require('express');
// const mysql = require('mysql2');
// const cors = require('cors');
// const bcrypt = require('bcrypt');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'Gutwan@123',
//   database: 'jd_education_login'
// });

// db.connect(err => {
//   if (err) {
//     console.error('MySQL connection failed:', err);
//     process.exit(1);
//   } else {
//     console.log('✅ Connected to MySQL database.');
//   }
// });

// app.post('/api/admin/login', (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ message: 'Email and password required' });
//   }

//   const query = 'SELECT * FROM admins WHERE email = ? LIMIT 1';
//   db.query(query, [email], async (err, results) => {
//     if (err) {
//       console.error('❌ Database query error:', err);
//       return res.status(500).json({ message: 'Database error' });
//     }

//     // ✅ Logging for debug
//     console.log('Checking admin login for:', email);
//     console.log('DB returned:', results);

//     if (results.length === 0) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }

//     const user = results[0];

//     try {
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (isMatch) {
//         return res.json({
//           message: 'Login successful',
//           token: 'fake-jwt-token',
//           redirectUrl: '/admin/dashboard.html'
//         });
//       } else {
//         return res.status(401).json({ message: 'Invalid email or password' });
//       }
//     } catch (compareError) {
//       console.error('❌ Password comparison error:', compareError);
//       return res.status(500).json({ message: 'Server error' });
//     }
//   });
// });



// // Handle contact form submission
// app.post('/api/contact', (req, res) => {
//   const { name, email, phone, course_completed, course_interested, message } = req.body;

//   if (!name || !email || !message) {
//     return res.status(400).json({ message: 'Name, email, and message are required' });
//   }

//   const query = `
//     INSERT INTO contact_messages 
//     (name, email, phone, course_completed, course_interested, message) 
//     VALUES (?, ?, ?, ?, ?, ?)`;

//   db.query(query, [name, email, phone, course_completed, course_interested, message], (err, result) => {
//     if (err) {
//       console.error('Failed to insert contact message:', err);
//       return res.status(500).json({ message: 'Database error' });
//     }

//     res.status(201).json({ message: 'Contact form submitted successfully' });
//   });
// });


// app.listen(5000, () => {
//   console.log('🚀 Server is running on http://localhost:5000');
// });



// for contact 


const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Gutwan@123',
  database: 'jd_education_login'
});

db.connect(err => {
  if (err) {
    console.error('MySQL connection failed:', err);
    process.exit(1);
  } else {
    console.log('✅ Connected to MySQL database.');
  }
});

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  const query = 'SELECT * FROM admins WHERE email = ? LIMIT 1';
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('❌ Database query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return res.json({
          message: 'Login successful',
          token: 'fake-jwt-token',
          redirectUrl: '/admin/dashboard.html'
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } catch (compareError) {
      console.error('❌ Password comparison error:', compareError);
      return res.status(500).json({ message: 'Server error' });
    }
  });
});

// ===== NEW CONTACT FORM POST ROUTE =====
app.post('/api/contact', (req, res) => {
  const { name, email, phone, course_completed, course_interested, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required' });
  }

  const query = `
    INSERT INTO contacts 
    (name, email, phone, course_completed, course_interested, message) 
    VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(query, [name, email, phone, course_completed, course_interested, message], (err, result) => {
    if (err) {
      console.error('Failed to insert contact message:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.status(201).json({ message: 'Contact form submitted successfully' });
  });
});

// ===== OPTIONAL: GET all contact messages =====
app.get('/api/contact/messages', (req, res) => {
  const query = 'SELECT * FROM contacts ORDER BY submitted_at DESC';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Failed to fetch contact messages:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.json(results);
  });
});




app.get('/api/contacts', (req, res) => {
  const { status, search, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM contacts';
  let countQuery = 'SELECT COUNT(*) as total FROM contacts';
  const params = [];
  const conditions = [];

  // Add filters if provided
  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR course_interested LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (conditions.length) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    query += whereClause;
    countQuery += whereClause;
  }

  // Add sorting and pagination
  query += ' ORDER BY submitted_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  // First get total count
  db.query(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) {
      console.error('Failed to count contacts:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Then get paginated data
    db.query(query, params, (err, results) => {
      if (err) {
        console.error('Failed to fetch contacts:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({
        data: results,
        total: countResult[0].total,
        page: parseInt(page),
        totalPages: Math.ceil(countResult[0].total / limit)
      });
    });
  });
});

// Update contact status
app.put('/api/contacts/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const query = 'UPDATE contacts SET status = ? WHERE id = ?';
  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('Failed to update contact status:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ message: 'Status updated successfully' });
  });
});

// Delete contact
app.delete('/api/contacts/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM contacts WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Failed to delete contact:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.status(204).end();
  });
});

// Get dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
  const queries = {
    totalContacts: 'SELECT COUNT(*) as count FROM contacts',
    newContacts: 'SELECT COUNT(*) as count FROM contacts WHERE status = "new"',
    contacted: 'SELECT COUNT(*) as count FROM contacts WHERE status = "contacted"',
    admitted: 'SELECT COUNT(*) as count FROM contacts WHERE status = "admitted"'
  };

  Promise.all([
    db.promise().query(queries.totalContacts),
    db.promise().query(queries.newContacts),
    db.promise().query(queries.contacted),
    db.promise().query(queries.admitted)
  ])
  .then(([[total], [newContacts], [contacted], [admitted]]) => {
    res.json({
      totalContacts: total[0].count,
      newContacts: newContacts[0].count,
      contacted: contacted[0].count,
      admitted: admitted[0].count
    });
  })
  .catch(err => {
    console.error('Failed to fetch dashboard stats:', err);
    res.status(500).json({ message: 'Database error' });
  });
});







app.listen(5000, () => {
  console.log('🚀 Server is running on http://localhost:5000');
});
