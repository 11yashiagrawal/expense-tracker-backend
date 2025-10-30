import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Income } from "../models/income.models.js";
import { Transaction } from "../models/transactions.models.js";
import { User } from "../models/user.models.js";

const addIncome = asyncHandler(async (req, res) => {
  const { title, amount, date } = req.body;

  if (!title.trim() || !amount || !date) {
    throw new ApiError(400, "Missing field values.");
  }

  const income = await Income.create({
    user: req.user?._id,
    title,
    amount,
    date: new Date(date),
  });

  const transaction = await Transaction.create({
    user: req.user?._id,
    title,
    amount,
    date: new Date(date),
    type: "Income",
    refId: income._id,
  });

  const balance = req.user?.balance;

  const newBalance = balance + amount;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        balance: newBalance,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  if (!income || !transaction || !user) {
    throw new ApiError(500, "Something went wrong while creating income.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, income, "Income created successfully."));
});

const getAllIncomes = asyncHandler(async (req, res) => {
  const incomes = await Income.find({ user: req.user?._id });

  if (!incomes) {
    throw new ApiError(500, "Something went wrong while fetching incomes.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, incomes, "Incomes fetched successfully."));
});

const getMonthIncomes = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.params;

  if (!startDate || !endDate) {
    throw new ApiError(400, "Both Start and End Dates are required.");
  }

  const incomes = await Income.find({
    user: req.user?._id,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, incomes, "Incomes fetched successfully."));
});

const updateIncome = asyncHandler(async (req, res) => {
  const { title, amount, date } = req.body;
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "No income to update.");
  }

  if (!title && !amount && !date) {
    throw new ApiError(400, "Provide values to update.");
  }

  const balance = req.user?.balance;

  const am = await Income.findById(id);

  const newBalance = balance - am.amount + amount;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        balance: newBalance,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  const income = await Income.findOneAndUpdate(
    { _id: id, user: req.user?._id },
    {
      title,
      amount,
      date: date ? new Date(date) : am.date,
    },
    {
      new: true,
    }
  );

  const transaction = await Transaction.findOneAndUpdate(
    { refId: id, user: req.user?._id, type: "Income" },
    {
      title,
      amount,
      date: date ? new Date(date) : am.date,
    },
    { new: true }
  );

  if (!income || !transaction || !user) {
    throw new ApiError(500, "Something went wrong while updating income.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, income, "Income updated successfully."));
});

const deleteIncome = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "No income given to delete.");
  }

  const balance = req.user?.balance;

  const am = await Income.findById(id);
  // console.log(am);

  const newBalance = balance - am.amount;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        balance: newBalance,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  const income = await Income.findOneAndDelete({
    _id: id,
    user: req.user?._id,
  });
  //   console.log("expense:", expense)
  const transaction = await Transaction.findOneAndDelete({
    refId: id,
    user: req.user?._id,
    type: "Income",
  });
  //   console.log("transaction:", transaction)
  if (!income || !transaction || !user) {
    throw new ApiError(500, "Something went wrong while deleting income.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Income deleted successfully."));
});

export {
  addIncome,
  getAllIncomes,
  getMonthIncomes,
  updateIncome,
  deleteIncome,
};
