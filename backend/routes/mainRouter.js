import express from "express";
const router = express.Router();

import authRouter from "./authRoutes.js";
import userRouter from "./userRoutes.js";

router.use("/user", userRouter);

router.get("/", (req, res) => {
  res.json({ status: "API is running" });
});

router.use("/auth", authRouter);

export default router;
