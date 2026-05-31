'use strict';

const mongoose = require('mongoose');
const logger = require('./logger');

let isConnected = false;

const connectDB = async () => {
  // ✅ Reuse existing connection on Vercel
  if (isConnected) {
    logger.info('✅ Using existing MongoDB connection');
    return;
  }

  try {
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      bufferCommands: false,        // ✅ Important for Vercel
    });

    isConnected = true;
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    isConnected = false;
    // ✅ Don't exit process on Vercel — just log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;