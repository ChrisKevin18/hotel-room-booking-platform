const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['Guest','Staff','Admin'], default: 'Guest', required: true }
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });
module.exports = mongoose.model('User', UserSchema);
