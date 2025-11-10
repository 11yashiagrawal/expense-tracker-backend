import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Expense } from "../models/expense.models.js";
import { Transaction } from "../models/transactions.models.js";
import { Category } from "../models/category.models.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

const addExpense = asyncHandler(async (req, res) => {
  const { title, amount, date, category } = req.body;

  if (!title.trim() || !amount || !date || !category) {
    throw new ApiError(400, "All fields are required.");
  }

  const cat = await Category.findOne({ user: req.user?._id, title: category });

  if (!cat) {
    throw new ApiError(400, "Invalid category name.");
  }

  const session = await mongoose.startSession();
  let expense = {};

  try {
    await session.withTransaction(async () => {
      const balance = req.user?.balance;

      const newBalance = balance - amount;

      if (newBalance < 0) {
        throw new ApiError(400, "Insufficient balance.");
      }

      expense = await Expense.create(
        [
          {
            user: req.user?._id,
            title,
            amount,
            date: new Date(date),
            category: cat._id,
          },
        ],
        { session }
      );
      // console.log(expense)
      const transaction = await Transaction.create(
        [
          {
            user: req.user?._id,
            title: title,
            amount: amount * -1,
            date: new Date(date),
            type: "Expense",
            refId: expense[0]._id,
          },
        ],
        { session }
      );
      // console.log(transaction)
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
      // console.log(user)
    });
  } catch (error) {
    throw new ApiError(500, "Something went wrong while creating expense.");
  } finally {
    session.endSession();
  }

  return res
    .status(201)
    .json(new ApiResponse(201, expense, "Expense created successfully."));
});

const getAllExpenses = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized Request.");
  }

  const expenses = await Expense.find({
    user: req.user?._id,
  });

  if (!expenses) {
    throw new ApiError(500, "Something went wrong while fetching expenses.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, expenses, "Expenses fetched successfully."));
});

const getMonthExpenses = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.params;

  if (!startDate || !endDate) {
    throw new ApiError(400, "Both Start and End Dates are required.");
  }

  const expenses = await Expense.find({
    user: req.user?._id,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  });

  const total=expenses.reduce((acc, expense)=>{
    return acc+expense.amount
  }, 0)

  return res
    .status(200)
    .json(new ApiResponse(200, {expenses, total}, "Expenses fetched successfully."));
});

const updateExpense = asyncHandler(async (req, res) => {
  const { title, amount, date, category } = req.body;
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "No expense to update.");
  }

  if (!title && !amount && !date && !category) {
    throw new ApiError(400, "Provide values to update.");
  }

  const session = await mongoose.startSession();
  let expense = {};

  try {
    await session.withTransaction(async () => {
      const balance = req.user?.balance;

      const am = await Expense.findById(id, null, { session });

      const newBalance = balance + am.amount - amount;

      if (newBalance < 0) {
        throw new ApiError(400, "Insufficient Balance.");
      }

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

      expense = await Expense.findOneAndUpdate(
        { _id: id, user: req.user?._id },
        {
          title,
          amount,
          date: date ? new Date(date) : am.date,
          category,
        },
        { new: true, session }
      );

      const transaction = await Transaction.findOneAndUpdate(
        { refId: id, user: req.user?._id, type: "Expense" },
        {
          title,
          amount: amount * -1,
          date: date ? new Date(date) : am.date,
        },
        { new: true, session }
      );
    });
  } catch (error) {
    throw new ApiError(500, "Something went wrong while updating expense.");
  } finally {
    session.endSession();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, expense, "Expense updated successfully."));
});

const deleteExpense = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "No expense given to delete.");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const balance = req.user?.balance;

      const am = await Expense.findById(id, null, { session });

      const newBalance = balance + am.amount;

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

      const expense = await Expense.findOneAndDelete(
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
          type: "Expense",
        },
        { session }
      );
      //   console.log("transaction:", transaction)
    });
  } catch (error) {
    throw new ApiError(500, "Something went wrong while deleting expense.");
  } finally {
    session.endSession();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Expense deleted successfully."));
});

const expenseforCategories = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.params;
  const expenditures = await Expense.aggregate([
    {
      $match: {
        user: req.user?._id,
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: "$category",
        expenditure: {
          $sum: "$amount",
        },
      },
    },
    {
      $sort: {
        expenditure: -1,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    {
      $unwind: "$categoryDetails",
    },
    {
      $project: {
        _id: 0,
        categoryId: "$_id",
        categoryName: "$categoryDetails.title",
        expenditure: 1,
        budget: "$categoryDetails.budget",
        colour: "$categoryDetails.colour"
      },
    },
  ]);

  if (!expenditures) {
    throw new ApiError(
      500,
      "Something went wrong while fetching expenditures."
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        expenditures,
        "Expenditures per category fetched successfully."
      )
    );
});

export {
  addExpense,
  getAllExpenses,
  getMonthExpenses,
  updateExpense,
  deleteExpense,
  expenseforCategories,
};
