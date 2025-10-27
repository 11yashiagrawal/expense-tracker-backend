import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, "First Name is required."],
      lowercase: true,
      trim: true,
      index: true,
    },
    last_name: {
      type: String,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      lowercase: true,
      unique: true,
      trim: true,
    },
    avatar: {
      type: String,
      required: [true, "Avatar is required."],
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    phone_no: {
      type: String,
      unique: true,
      required: [true, "Phone Number is required."],
    },
    monthly_budget: {
      type: Number,
      required: [true, "Monthly Budget is required."],
      default: 5000,
    },
    balance: {
      type: Number,
      required: [true, "Balance is required."],
    },
    categories: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      first_name: this.first_name,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
