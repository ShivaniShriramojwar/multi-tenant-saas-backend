import mongoose from "mongoose";
import { logger } from "../../common/logger";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;

    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri);

    logger.info("MongoDB connected");
  } catch (error) {
    logger.error({ err: error }, "MongoDB connection error");
    process.exit(1);
  }
};

export { connectDB };
