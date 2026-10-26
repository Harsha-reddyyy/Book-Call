import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

let memServer = null;

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  try {
    if (mongoUri && mongoUri.trim() !== '') {
      if (/<[^>]+>/.test(mongoUri)) {
        console.warn('\n⚠️  [Database Warning] MONGODB_URI contains template placeholders (like <db_username> or <password>).');
        console.warn('👉 In MongoDB Atlas -> "Database Access", find or create a user and replace <db_username> with that username in backend/.env.');
        console.warn('👉 Example: mongodb+srv://myUser:myPassword@cluster0.dzjwdl4.mongodb.net/callbook?retryWrites=true&w=majority\n');
        throw new Error('MONGODB_URI contains unreplaced placeholder tokens (e.g. <db_username>)');
      }

      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Database] Connected to MongoDB via MONGODB_URI`);
      return;
    }

    // Fallback: If no URI provided, attempt in-memory server for development/demo
    console.log('[Database] No MONGODB_URI provided. Starting in-memory MongoDB server for development...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memServer = await MongoMemoryServer.create();
    const uri = memServer.getUri();
    await mongoose.connect(uri);
    console.log(`[Database] Connected to in-memory MongoDB at ${uri}`);
  } catch (error) {
    if (!error.message.includes('unreplaced placeholder tokens')) {
      console.error('[Database] MongoDB connection error:', error.message);
    }
    // If external URI failed, try memory server as fallback for resilience
    try {
      console.log('[Database] Attempting fallback to in-memory MongoDB instance...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memServer = await MongoMemoryServer.create();
      const uri = memServer.getUri();
      await mongoose.connect(uri);
      console.log(`[Database] Connected to in-memory fallback MongoDB at ${uri}`);
    } catch (fallbackErr) {
      console.error('[Database] Critical: Failed to establish any MongoDB connection:', fallbackErr.message);
      throw error;
    }
  }
};

export const closeDB = async () => {
  try {
    await mongoose.disconnect();
    if (memServer) {
      await memServer.stop();
    }
  } catch (err) {
    console.error('Error closing database:', err.message);
  }
};
