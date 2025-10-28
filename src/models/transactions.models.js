import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const transactionSchema = new mongoose.Schema(
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
      required: [true, "Transaction Date is required."],
      default: Date.now,
    },
    type: {
      type: String,
      required: true,
      enum: ["Income", "Expense", "Subscription"]
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "type",
      required: true
    }
  },
  { timestamps: true }
);

transactionSchema.plugin(mongooseAggregatePaginate);

export const Transaction = mongoose.model("Transaction", transactionSchema);