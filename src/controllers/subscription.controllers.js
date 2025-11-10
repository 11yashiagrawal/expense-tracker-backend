import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.models.js";

const addSubscription = asyncHandler(async (req, res) => {
  const {
    title,
    frequency,
    startDate,
    endDate,
    nextPaymentDate,
    amount,
    active,
  } = req.body;

  if (
    !title.trim() ||
    !frequency.trim() ||
    !startDate ||
    !endDate ||
    !nextPaymentDate ||
    !amount
  ) {
    throw new ApiError(400, "All fiels are required.");
  }

  const subscription = await Subscription.create({
    user: req.user?._id,
    title,
    frequency,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    nextPaymentDate: new Date(nextPaymentDate),
    amount,
    active,
  });

  if (!subscription) {
    throw new ApiError(
      500,
      "Something went wrong while creating subscription."
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, subscription, "Subscription created successfully.")
    );
});

const getAllSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ user: req.user?._id });

  if (!subscriptions) {
    throw new ApiError(
      500,
      "Something went wrong while fetching subscriptions."
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscriptions, "Subscriptions fetched successfully.")
    );
});

const updateSubscription = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "No subscription to update.");
  }

  const {
    title,
    frequency,
    startDate,
    endDate,
    nextPaymentDate,
    amount,
    active,
  } = req.body;

  if (
    !title &&
    !frequency &&
    !startDate &&
    !endDate &&
    !nextPaymentDate &&
    !amount
  ) {
    throw new ApiError(400, "Provide fields to update.");
  }

  const old = await Subscription.findById(id);

  const subscription = await Subscription.findOneAndUpdate(
    { _id: id, user: req.user?._id },
    {
      title,
      frequency,
      startDate: startDate ? new Date(startDate) : old.startDate,
      endDate: endDate ? new Date(endDate) : old.endDate,
      nextPaymentDate: nextPaymentDate
        ? new Date(nextPaymentDate)
        : old.nextPaymentDate,
      amount,
      active,
    },
    { new: true }
  );

  if (!subscription) {
    throw new ApiError(
      500,
      "Something went wrong while updating subscription."
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscription, "Subscription updated successfully.")
    );
});

const deleteSubscription = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "No subscription to delete.");
  }

  const subscription = await Subscription.findOneAndDelete({
    _id: id,
    user: req.user?._id,
  });

  if (!subscription) {
    throw new ApiError(
      500,
      "Something went wrong while deleting subscription."
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Subscription deleted successfully."));
});

const paymentsThisMonth = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.params;
  const subscriptions = await Subscription.aggregate([
    {
      $match: {
        user: req.user?._id,
        active: true,
        nextPaymentDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $project: {
        title: 1,
        amount: 1,
        nextPaymentDate: 1,
      },
    },
  ]);
  if(!subscriptions){
    throw new ApiError(500, "Something went wrong while fetching subscriptions.")
  }
  const total=subscriptions.reduce((acc, sub)=>{
    return acc+sub.amount
  }, 0)

  return res.status(200).json(new ApiResponse(200, {subscriptions, total}, "Subscriptions for this month fetched successfully."))
});

export {
  addSubscription,
  getAllSubscriptions,
  updateSubscription,
  deleteSubscription,
  paymentsThisMonth
};
