import express from "express";
const router = express.Router();

import AuthController from "../controllers/authController.js";
const authController = new AuthController();

import {
  registerFields,
  loginFields,
  isAuthenticated,
} from "../middleware/auth.js";

router.get("/", (req, res) => {
  res.json({ status: "API is running" });
});

router.post("/auth/register", registerFields, (req, res, next) =>
  authController.register(req, res, next)
);

router.post("/auth/login", loginFields, (req, res, next) =>
  authController.login(req, res, next)
);

router.get("/auth/confirm-email", (req, res, next) =>
  authController.confirmEmail(req, res, next)
);

router.post("/auth/resend-confirmation", (req, res, next) => {
  authController.resendConfirmation(req, res, next);
});

router.post("/auth/logout", isAuthenticated, (req, res, next) =>
  authController.logout(req, res, next)
);

router.get("/auth/me", isAuthenticated, (req, res, next) =>
  authController.getCurrentUser(req, res, next)
);

export default router;
