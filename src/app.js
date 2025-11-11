import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow requests without origin
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

//routes
import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter);

import expenseRouter from "./routes/expense.routes.js";
app.use("/api/v1/expenses", expenseRouter);

import incomeRouter from "./routes/income.routes.js";
app.use("/api/v1/income", incomeRouter);

import subscriptionRouter from "./routes/subscription.routes.js";
app.use("/api/v1/subscriptions", subscriptionRouter);

import transactionRouter from "./routes/transaction.routes.js";
app.use("/api/v1/transactions", transactionRouter);

export { app };
