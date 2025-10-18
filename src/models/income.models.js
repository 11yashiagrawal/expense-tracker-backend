import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const incomeSchema = new mongoose.Schema(
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
      required: [true, "Income Date is required."],
      default: Date.now,
    },
  },
  { timestamps: true }
);

incomeSchema.plugin(mongooseAggregatePaginate);

export const Income = mongoose.model("Income", incomeSchema);
