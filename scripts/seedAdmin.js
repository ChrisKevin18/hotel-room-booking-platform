const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function seedAdmin() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined. Copy .env.example to .env and configure it.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected.");

  const email = process.env.ADMIN_EMAIL || "admin@hotelbooking.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123";
  const name = process.env.ADMIN_NAME || "System Admin";

  let user = await User.findOne({ email });
  const hashedPassword = await bcrypt.hash(password, 12);

  if (user) {
    user.name = name;
    user.role = "Admin";
    user.passwordHash = hashedPassword;
    await user.save();
    console.log(`Admin updated: ${email}`);
  } else {
    await User.create({ name, email, passwordHash: hashedPassword, role: "Admin" });
    console.log(`Admin created: ${email}`);
  }

  console.log(`Admin email: ${email}`);
  console.log(`Admin password: ${password}`);
  await mongoose.disconnect();
}

seedAdmin().catch(async (err) => {
  console.error("Seed admin failed:", err.message);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
