require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./dist/models/User').default;

(async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    
    const admin = await User.findOne({ role: 'admin' }).select('-password');
    console.log('Admin user:', JSON.stringify(admin, null, 2));
    
    const allUsers = await User.find().select('_id name email role').limit(5);
    console.log('\nAll users:', JSON.stringify(allUsers, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
