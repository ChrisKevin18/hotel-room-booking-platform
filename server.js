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
  try { await connectDB(); app.listen(PORT,()=>console.log(`Server running on port ${PORT}`)); }
  catch(err){ console.error("MongoDB connection error:",err.message); process.exit(1); }
}
if(require.main===module) start();
module.exports = app;
