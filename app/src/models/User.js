import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password_hash: {
    type: String,
    required: true,
  }
}, {
  timestamps: true, // Automatically manages createdAt and updatedAt fields
});

// Check if the model already exists to prevent OverwriteModelError in Next.js
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;

