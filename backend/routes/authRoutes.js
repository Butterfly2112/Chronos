import express from "express";
const authRouter = express.Router();

import AuthController from "../controllers/authController.js";
const authController = new AuthController();

import {
  registerFields,
  loginFields,
  isAuthenticated,
} from "../middleware/auth.js";

authRouter.post("/register", registerFields, (req, res, next) =>
  authController.register(req, res, next)
);

authRouter.post("/login", loginFields, (req, res, next) =>
  authController.login(req, res, next)
);

authRouter.get("/confirm-email", (req, res, next) =>
  authController.confirmEmail(req, res, next)
);

authRouter.post("/resend-confirmation", (req, res, next) => {
  authController.resendConfirmation(req, res, next);
});

authRouter.post("/logout", isAuthenticated, (req, res, next) =>
  authController.logout(req, res, next)
);

authRouter.get("/me", isAuthenticated, (req, res, next) =>
  authController.getCurrentUser(req, res, next)
);

authRouter.post("/request-password-reset", (req, res, next) =>
  authController.requestPasswordReset(req, res, next)
);

authRouter.get("/reset-password", (req, res, next) =>
  authController.givePasswordTokenInfo(req, res, next)
);

authRouter.post("/reset-password", (req, res, next) =>
  authController.resetPassword(req, res, next)
);

export default authRouter;
