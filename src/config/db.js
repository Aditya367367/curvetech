const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');

  try {
    const conn = await mongoose.connect(uri, {
      // Connection pooling configuration
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2,  // Minimum number of connections in the pool
      maxIdleTimeMS: 30000, // Maximum time a connection can be idle
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Timeout for socket operations
      // SSL configuration (if needed)
      ssl: process.env.MONGODB_SSL === 'true',
      // Authentication options
      authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
      // Read preferences
      readPreference: 'primaryPreferred',
      // Write concerns
      w: 'majority',
      journal: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Monitor connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    if (process.env.NODE_ENV === 'test') {
      throw error; // Don't exit in test environment
    }
    process.exit(1);
  }
};

module.exports = connectDB;
