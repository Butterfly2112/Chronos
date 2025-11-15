import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { connectDB } from "./config/db.js";
import mainRouter from "./routes/mainRouter.js";
import sessionConfig from "./config/session.js";
import AppError from "./utils/AppError.js";
import errorHandler from "./middleware/errorHandler.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionConfig());

if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

app.use("/api", mainRouter);

// перенаправляє браузер на той самий хост, але на порт 3001, щоб користувач бачив інтерфейс користувача
app.get('/confirm-email', (req, res) => {
  const token = req.query.token
  const protocol = req.protocol || (process.env.FRONTEND_PROTOCOL || 'http')
  const host = req.hostname || process.env.FRONTEND_HOST || 'localhost'
  const port = process.env.FRONTEND_PORT || '3001'
  const portPart = port ? `:${port}` : ''
  const redirectUrl = `${protocol}://${host}${portPart}/confirm-email${token ? `?token=${encodeURIComponent(token)}` : ''}`
  return res.redirect(302, redirectUrl)
})

app.get("/", (req, res) => {
  res.send("Chronos backend is running, use /api to access API routes.");
});

app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
