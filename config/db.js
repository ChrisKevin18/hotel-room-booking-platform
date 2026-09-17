const mongoose = require('mongoose');

// In a serverless environment (e.g. Vercel), this module can be loaded fresh
// on every cold start, and the function handler can be invoked many times
// against the same warm instance. Caching the connection on `global` avoids
// reconnecting to MongoDB (and exhausting the connection pool) on every request.
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is not defined in the environment');

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUri)
      .then((mongooseInstance) => {
        console.log('MongoDB connected successfully!');
        return mongooseInstance;
      })
      .catch((err) => {
        // Reset so the next request can retry instead of being stuck on a
        // rejected promise forever.
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;