import dotenv from "dotenv/config";
import app from "./app.ts";
import { connectDB } from "./config/db.ts";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    process.on("SIGINT", () => {
      console.log("🛑 Shutting down...");
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error("❌ Failed to start server", error);
    process.exit(1);
  }
};

startServer();
