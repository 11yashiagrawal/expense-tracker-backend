import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getTransactions} from "../controllers/transaction.controllers.js";

const router = Router();

router.route("/").get(verifyJWT, getTransactions);

export default router;
