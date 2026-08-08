const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = (process.env.MONGODB_URI || 'mongodb://localhost:27017/api_testing_app').replace(/^"|"$/g, '');

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = mongoose;
