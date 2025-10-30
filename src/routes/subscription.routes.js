import { Router } from "express";
import {
  addSubscription,
  getAllSubscriptions,
  updateSubscription,
  deleteSubscription,
} from "../controllers/subscription.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, addSubscription);

router.route("/").get(verifyJWT, getAllSubscriptions);

router.route("/:id").patch(verifyJWT, updateSubscription);

router.route("/:id").delete(verifyJWT, deleteSubscription);

export default router;
