const bcrypt = require('bcrypt');

const plainPassword = 'admin123'; // Your desired login password
bcrypt.hash(plainPassword, 10, (err, hash) => {
  if (err) throw err;
  console.log('Hashed password:', hash);
});
