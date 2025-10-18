import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const expenseSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: [true, "Amount is required."],
      default: 0,
    },
    date: {
      type: Date,
      required: [true, "Expense Date is required."],
      default: Date.now,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required."],
    },
  },
  { timestamps: true }
);

expenseSchema.plugin(mongooseAggregatePaginate);

export const Expense = mongoose.model("Expense", expenseSchema);
