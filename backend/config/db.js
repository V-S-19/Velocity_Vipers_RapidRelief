const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[DATABASE] MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DATABASE ERROR] connection failed: ${error.message}`);
    console.warn('[DATABASE WARNING] Server starting in offline mode. Please configure MONGO_URI in .env.');
  }
};

module.exports = connectDB;
