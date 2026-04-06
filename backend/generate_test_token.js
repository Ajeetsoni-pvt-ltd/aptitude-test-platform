require('dotenv').config();
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('ERROR: JWT_SECRET not found in .env');
  process.exit(1);
}

// Admin user ID from database
const adminId = '69c525dbd303b01fbd7df3ca';
const payload = {
  id: adminId,
  role: 'admin'
};

const token = jwt.sign(payload, secret, { expiresIn: '7d' });
console.log('TEST TOKEN FOR ADMIN:');
console.log(token);
console.log('\nUSE THIS TOKEN IN AUTH HEADER:');
console.log(`Authorization: Bearer ${token}`);
