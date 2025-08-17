const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected successfully");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  });