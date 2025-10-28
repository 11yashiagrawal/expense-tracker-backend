import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
    },
    budget: {
      type: Number,
      required: [true, "Budget is required."],
      default: 1000
    },
    icon: {
      type: String,
      required: [true, "Icon is required."],
    },
    colour: {
      type: String,
      required: [true, "Colour is required."],
      default: "green",
    },
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);
