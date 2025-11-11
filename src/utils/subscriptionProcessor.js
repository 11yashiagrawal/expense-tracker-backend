import { User } from "../models/user.models.js";
import { Transaction } from "../models/transactions.models.js";
import { Subscription } from "../models/subscription.models.js";
import mongoose, { get } from "mongoose";

const getNextDate = (current, frequency) => {
  const date = new Date(current);
  switch (frequency) {
    case "Daily":
      date.setDate(date.getDate() + 1);
      break;
    case "Weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "Bi-Weekly":
      date.setDate(date.getDate() + 15);
      break;
    case "Monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "Quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "Yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date;
};

const processSubscriptions = async () => {
  const today = new Date();
  const subscriptions = await Subscription.find().populate("user");
  if (!subscriptions) {
    console.log("No subscriptions exist.");
  }

  for (const sub of subscriptions) {
    const user = sub.user;
    if (!user) {
      console.log(`Skipped subscription ${sub.title} due to no user.`);
      continue;
    }

    if (!sub.active) {
      continue;
    }

    const nextPayment = new Date(sub.nextPaymentDate);
    if (nextPayment.toDateString() != today.toDateString()) {
      continue;
    }

    if (user.balance < sub.amount) {
      console.log(`Insufficient Balance for ${user.first_name} - ${sub.title}`);
      sub.active = false;
      await sub.save();
      continue;
    }
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        user.balance -= sub.amount;
        await user.save({ session });
        // console.log('user', user)
        const transaction = await Transaction.create(
          [
            {
              user: user._id,
              title: sub.title,
              amount: sub.amount * -1,
              date: today,
              type: "Subscription",
              refId: sub._id,
            },
          ],
          { session }
        );
        // console.log('transaction', transaction)
        const nextPaymentDate = getNextDate(today, sub.frequency);
        if (sub.endDate < nextPaymentDate) {
          sub.active = false;
        } else {
          sub.nextPaymentDate = nextPaymentDate;
        }
        // console.log('next payment date', sub.nextPaymentDate)
        await sub.save({ session });
        // console.log('subscription', sub)
      });
    } catch (error) {
      console.log("Error in editing database:", error);
    } finally {
      session.endSession();
    }
  }
};

export const startSubscriptionPayments = () => {
  processSubscriptions();
  const one_day = 24 * 60 * 60 * 1000;
  setInterval(processSubscriptions, one_day);
};