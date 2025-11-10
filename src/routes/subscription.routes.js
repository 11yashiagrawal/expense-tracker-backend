import { Router } from "express";
import {
  addSubscription,
  getAllSubscriptions,
  updateSubscription,
  deleteSubscription,
  paymentsThisMonth
} from "../controllers/subscription.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, addSubscription);

router.route("/").get(verifyJWT, getAllSubscriptions);

router.route("/:id").patch(verifyJWT, updateSubscription);

router.route("/:id").delete(verifyJWT, deleteSubscription);

router.route("/:startDate/:endDate").get(verifyJWT, paymentsThisMonth);

export default router;