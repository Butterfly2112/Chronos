import session from "express-session";
import MongoStore from "connect-mongo";
import AppError from "../utils/AppError.js";

const createSessionConfig = () => {
  if (!process.env.MONGO_URI) {
    throw new AppError(
      "MONGO_URI is not defined in environment variables",
      500
    );
  }

  return session({
    secret: process.env.SESSION_SECRET || "secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 60 * 15,
    }),
    cookie: {
      maxAge: 1000 * 60 * 15,
      httpOnly: true,
      sameSite: "lax",
    },
  });
};

export default createSessionConfig;
