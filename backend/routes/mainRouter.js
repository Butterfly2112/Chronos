import express from "express";
const router = express.Router();

import authRouter from "./authRoutes.js";
import userRouter from "./userRoutes.js";
import calendarRouter from "./calendarRoutes.js";

router.get("/", (req, res) => {
  res.json({ status: "API is running" });
});

router.use("/user", userRouter);
router.use("/auth", authRouter);
router.use("/calendar", calendarRouter);

export default router;
