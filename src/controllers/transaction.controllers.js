import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Transaction } from "../models/transactions.models.js";

const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user?._id });

  if (!transactions) {
    throw new ApiError(
      500,
      "Something went wrong while fetching transactions."
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, transactions, "Transactions fetched successfully.")
    );
});

export { getTransactions };
