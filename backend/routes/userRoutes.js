import express from "express";
const userRouter = express.Router();

import UserController from "../controllers/userController.js";
const userController = new UserController();

import { isAuthenticated } from "../middleware/auth.js";
import { uploadAvatar } from "../config/multer.js";

userRouter.put("/profile", isAuthenticated, (req, res, next) => {
  userController.updateProfile(req, res, next);
});

userRouter.post("/avatar", isAuthenticated, uploadAvatar, (req, res, next) =>
  userController.updateAvatar(req, res, next)
);

userRouter.get("/search", (req, res, next) => {
  userController.searchUser(req, res, next);
});

userRouter.delete("/profile", isAuthenticated, (req, res, next) => {
  userController.deleteUser(req, res, next);
});

// Обов'язково має бути останнім роутом, щоб не конфліктував з іншими
userRouter.get("/:id", (req, res, next) => {
  userController.getUserInfo(req, res, next);
});

export default userRouter;
