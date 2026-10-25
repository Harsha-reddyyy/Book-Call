import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: 'Harsha',
    },
    role: {
      type: String,
      default: 'admin',
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify password
adminSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Static helper to hash password
adminSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

export const Admin = mongoose.model('Admin', adminSchema);
