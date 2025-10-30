import { Router } from "express";
import {
  addIncome,
  getAllIncomes,
  getMonthIncomes,
  updateIncome,
  deleteIncome,
} from "../controllers/income.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, addIncome);

router.route("/").get(verifyJWT, getAllIncomes);

router.route("/:startDate/:endDate").get(verifyJWT, getMonthIncomes);

router.route("/:id").patch(verifyJWT, updateIncome);

router.route("/:id").delete(verifyJWT, deleteIncome);

export default router;
