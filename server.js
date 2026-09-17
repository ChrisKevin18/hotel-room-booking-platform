const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();
const app = express();
app.use(express.json());

// Serve the demo frontend from the same Express application.
app.use(express.static(path.join(__dirname, "frontend")));

// Kick off the MongoDB connection as soon as this module loads. This matters
// in serverless environments (e.g. Vercel): the file is `require`d as a
// module rather than executed directly, so `require.main === module` below
// is false and `start()` never runs there. Without this, every DB-backed
// route (like /api/hotels) would 500 because Mongoose was never connected.
const dbConnection = connectDB().catch((err) => {
  console.error("MongoDB connection error:", err.message);
  return null;
});

// Make sure the connection (or a clear connection error) is resolved before
// any request reaches a route that touches the database. Scoped to /api so
// the static frontend still renders even if the DB is briefly unavailable.
app.use("/api", async (req, res, next) => {
  try {
    const conn = await dbConnection;
    if (!conn) {
      const err = new Error("Database connection is not available");
      err.statusCode = 503;
      err.errorCode = "DB_UNAVAILABLE";
      throw err;
    }
    next();
  } catch (err) {
    next(err);
  }
});

const authRoutes = require("./routes/authRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const pricingRoutes = require("./routes/pricingRoutes");
const reportRoutes = require("./routes/reportRoutes");
const housekeepingRoutes = require("./routes/housekeepingRoutes");

app.use("/api/auth", authRoutes);
app.use("/api", hotelRoutes);
app.use("/api", roomRoutes);
app.use("/api", bookingRoutes);
app.use("/api", pricingRoutes);
app.use("/api", reportRoutes);
app.use("/api", housekeepingRoutes);

app.get("/", (req,res) => res.sendFile(path.join(__dirname, "frontend", "index.html")));
app.use((req,res)=>res.status(404).json({success:false,message:"Route not found",errorCode:"NOT_FOUND"}));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
async function start(){
  const conn = await dbConnection;
  if (!conn) { process.exit(1); } // connection error already logged above
  app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
}
if(require.main===module) start();
module.exports = app;