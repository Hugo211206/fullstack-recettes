const mongoose = require('mongoose');

async function connectDB(uri) {
  await mongoose.connect(uri);
  console.log('Connecté à MongoDB');
}

module.exports = connectDB;