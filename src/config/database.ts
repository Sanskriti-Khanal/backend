import mongoose from 'mongoose';
import env from './env';

// Cache the connection promise to prevent multiple simultaneous connection attempts
let connectionPromise: Promise<typeof mongoose> | null = null;

const connectDatabase = async (): Promise<void> => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If a connection attempt is already in progress, wait for it
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  // Start a new connection attempt
  connectionPromise = (async () => {
    try {
      // Configure mongoose for serverless environments
      const options = {
        bufferCommands: false, // Disable mongoose buffering for serverless
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      };

      await mongoose.connect(env.MONGODB_URI, options);
      console.log('✅ MongoDB connected');
      return mongoose;
    } catch (error) {
      // Clear the promise cache on error so we can retry
      connectionPromise = null;
      console.error('❌ MongoDB connection failed:', error);
      
      // In serverless environments, don't exit the process
      // Let the error propagate so it can be handled by the error middleware
      const isServerless = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME;
      if (!isServerless) {
        console.error('⚠️  Make sure MongoDB is running: brew services start mongodb-community');
        console.error('⚠️  Or start MongoDB manually: mongod');
        process.exit(1);
      }
      throw error; // Re-throw for serverless error handling
    }
  })();

  await connectionPromise;
};

export default connectDatabase;

