import dotenv from "dotenv";
import connectDB from "../db/connectDB.js";
import { processSubscriptions } from "../utils/subscriptionProcessor.js";

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB");
    await processSubscriptions();
    console.log("Processed all subscriptions successfully.");
  } catch (error) {
    console.error("Error running subscription processor:", error);
  } finally {
    process.exit(0); 
  }
};

run();