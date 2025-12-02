import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Transaction } from "../models/transactions.models.js";

const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.aggregate([
    {
      $match: { 
        user:  req.user?._id
      }
    },
    {
      $lookup: {
        from: "expenses",
        localField: "refId",
        foreignField: "_id",
        as: "expense"
      }
    },
    {
      $unwind: "$expense"
    },
  {
    $lookup: {
      from: "categories",
      localField: "expense.category",
      foreignField: "_id",
      as: "cat"
    }
  },
  {
    $unwind: "$cat"
  },
  {
    $project: {
      user: 1,
      title: 1,
      amount: 1,
      date: 1,
      type: 1,
      category_title: "$cat.title",
      category_icon: "$cat.icon",
      category_colour: "$cat.colour"
    }
  }
  ]);

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
