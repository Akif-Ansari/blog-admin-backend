import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI as string);
    console.log("Database connected...");
  } catch (error) {
    console.error("DB connection failed...", error);
    process.exit(1);
  }
};
