import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import morgan from "morgan";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize());
app.use(hpp());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/health", (req, res) => {
  res.send("OK");
});

app.use((err: any, req: any, res: any, next: any) => {
  res.status(500).json({ message: err.message });
});

export default app;
