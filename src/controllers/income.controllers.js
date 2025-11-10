import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Income } from "../models/income.models.js";
import { Transaction } from "../models/transactions.models.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

const addIncome = asyncHandler(async (req, res) => {
  const { title, amount, date } = req.body;

  if (!title.trim() || !amount || !date) {
    throw new ApiError(400, "Missing field values.");
  }

  const session = await mongoose.startSession();

  let income = {};

  try {
    await session.withTransaction(async () => {
      income = await Income.create(
        [
          {
            user: req.user?._id,
            title,
            amount,
            date: new Date(date),
          },
        ],
        { session }
      );

      const transaction = await Transaction.create(
        [
          {
            user: req.user?._id,
            title,
            amount,
            date: new Date(date),
            type: "Income",
            refId: income[0]._id,
          },
        ],
        { session }
      );

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
          session,
        }
      ).select("-password -refreshToken");
    });
  } catch (error) {
    throw new ApiError(500, "Something went wrong while creating income.");
  } finally {
    session.endSession();
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

  const total = incomes.reduce((acc, income)=>{
    return acc+income.amount
  }, 0)

  return res
    .status(200)
    .json(new ApiResponse(200, {incomes, total}, "Incomes fetched successfully."));
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

  const session = await mongoose.startSession();

  let income = {};

  try {
    await session.withTransaction(async () => {
      const balance = req.user?.balance;

      const am = await Income.findById(id, null, { session });
      // console.log('am', am)
      const newBalance = balance - am.amount + amount;
      // console.log('new balance', newBalance)
      const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: {
            balance: newBalance,
          },
        },
        {
          new: true,
          session,
        }
      ).select("-password -refreshToken");
      // console.log('user', user)
      income = await Income.findOneAndUpdate(
        { _id: id, user: req.user?._id },
        {
          title,
          amount,
          date: date ? new Date(date) : am.date,
        },
        {
          new: true,
          session,
        }
      );
      // console.log('income', income)
      const transaction = await Transaction.findOneAndUpdate(
        { refId: id, user: req.user?._id, type: "Income" },
        {
          title,
          amount,
          date: date ? new Date(date) : am.date,
        },
        { new: true, session }
      );
      // console.log('transaction', transaction)
    });
  } catch (error) {
    throw new ApiError(500, "Something went wrong while updating income.");
  } finally {
    session.endSession();
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

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const balance = req.user?.balance;

      const am = await Income.findById(id, null, { session });
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
          session,
        }
      ).select("-password -refreshToken");

      const income = await Income.findOneAndDelete(
        {
          _id: id,
          user: req.user?._id,
        },
        { session }
      );
      //   console.log("expense:", expense)
      const transaction = await Transaction.findOneAndDelete(
        {
          refId: id,
          user: req.user?._id,
          type: "Income",
        },
        { session }
      );
      //   console.log("transaction:", transaction)
    });
  } catch (error) {
    throw new ApiError(500, "Something went wrong while deleting income.");
  } finally {
    session.endSession();
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
