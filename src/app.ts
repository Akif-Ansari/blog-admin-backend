import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import morgan from "morgan";
import authRoutes from "./modules/auth/auth.route.ts";
const app = express();

const allowedOrigins = ["http://localhost:8080"];
app.use(helmet());
// app.use(
//   cors({
//     origin: allowedOrigins,
//     credentials: true,
//   }),
// );
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const sanitize = (obj: any) => {
    if (obj instanceof Object) {
      for (const key in obj) {
        if (key.startsWith("$") || key.includes(".")) {
          const newKey = key.replace(/[\$.]/g, "_");
          obj[newKey] = obj[key];
          delete obj[key];
        }
        sanitize(obj[key]);
      }
    }
  };
  sanitize(req.body);
  sanitize(req.params);
  sanitize(req.query);
  next();
});
app.use(hpp());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/auth", authRoutes);

// app.use((err: any, req: any, res: any, next: any) => {
//   res.status(500).json({ message: err.message });
// });

export default app;
