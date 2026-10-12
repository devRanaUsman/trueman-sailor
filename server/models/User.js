import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email'],
    },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['client', 'admin'], default: 'client' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.matchPassword = function (entered) {
  if (!this.password) return false;
  if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    return entered === this.password;
  }
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
