import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const subscriptionSchema = new mongoose.Schema(
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
    frequency: {
      type: String,
      required: [true, "Frequency of payment is required."],
      enum: ["Daily", "Weekly", "Bi-Weekly", "Monthly", "Quarterly", "Yearly"],
    },
    startDate: {
      type: Date,
      required: [true, "Start Date of subscription is required."],
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, "End Date of subscription is required."],
      default: NaN,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required."],
      default: 0,
    },
  },
  { timestamps: true }
);

subscriptionSchema.plugin(mongooseAggregatePaginate);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
