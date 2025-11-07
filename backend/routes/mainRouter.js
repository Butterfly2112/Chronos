import express from "express";
const router = express.Router();

import AuthController from "../controllers/authController.js";
const authController = new AuthController();

import { registerFields } from "../middleware/auth.js";

router.get("/", (req, res) => {
  res.json({ status: "API is running" });
});

router.post("/auth/register", registerFields, (req, res) =>
  authController.register(req, res)
);

export default router;
