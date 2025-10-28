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

router.route("/addExpense").post(verifyJWT, addExpense);

router.route("/getAllExpenses").get(verifyJWT, getAllExpenses);

router.route("/e/:startDate/:endDate").get(verifyJWT, getMonthExpenses);

router.route("/updateExpense/:id").patch(verifyJWT, updateExpense);

router.route("/deleteExpense/:id").delete(verifyJWT, deleteExpense);

router.route("/expenseforCategories/:startDate/:endDate").get(verifyJWT, expenseforCategories);

export default router;
