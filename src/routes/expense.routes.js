import { Router } from "express";
import {
  addExpense,
  getAllExpenses,
  getMonthExpenses,
  updateExpense,
  deleteExpense,
  expenseforCategories,
} from "../controllers/expense.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, addExpense);

router.route("/").get(verifyJWT, getAllExpenses);

router.route("/:startDate/:endDate").get(verifyJWT, getMonthExpenses);

router.route("/:id").patch(verifyJWT, updateExpense);

router.route("/:id").delete(verifyJWT, deleteExpense);

router.route("/per-category/:startDate/:endDate").get(verifyJWT, expenseforCategories);

export default router;
