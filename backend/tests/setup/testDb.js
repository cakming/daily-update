import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

/**
 * Connect to in-memory database for testing
 */
export const connectTestDB = async () => {
  try {
    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // Create new in-memory database
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Test database connected');
  } catch (error) {
    console.error('Test database connection error:', error);
    throw error;
  }
};

/**
 * Disconnect and stop in-memory database
 */
export const closeTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('Test database closed');
  } catch (error) {
    console.error('Test database close error:', error);
    throw error;
  }
};

/**
 * Clear all collections in test database
 */
export const clearTestDB = async () => {
  try {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Test database clear error:', error);
    throw error;
  }
};

/**
 * Drop all collections in test database
 */
export const dropTestDB = async () => {
  try {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.drop();
    }
  } catch (error) {
    // Ignore error if collection doesn't exist
    if (error.message !== 'ns not found') {
      console.error('Test database drop error:', error);
    }
  }
};
