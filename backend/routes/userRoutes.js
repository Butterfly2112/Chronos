import express from "express";
const userRouter = express.Router();

import UserController from "../controllers/userController.js";
const userController = new UserController();

import { isAuthenticated } from "../middleware/auth.js";
import { uploadAvatar } from "../config/multer.js";

userRouter.use(isAuthenticated);

userRouter.put("/profile", (req, res, next) => {
  userController.updateProfile(req, res, next);
});

userRouter.post("/avatar", uploadAvatar, (req, res, next) =>
  userController.updateAvatar(req, res, next)
);

export default userRouter;
