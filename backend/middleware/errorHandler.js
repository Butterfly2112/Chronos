import AppError from "../utils/AppError.js";

const handleMongooseError = (err) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return new AppError(`${field} already exists`, 409);
  }

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return new AppError(`Validation error: ${errors.json(", ")}`, 400);
  }

  if (err.name === "CastError") {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  return err;
};

const errorHandler = (err, req, res, next) => {
  if (!err.isOperational) {
    err = handleMongooseError(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
    return res.status(statusCode).json({
      status: "error",
      message,
      stack: errorHandler.stack,
      error: err,
    });
  }

  res.status(statusCode).json({
    status: "error",
    message: err.isOperational ? message : "Something went wrong",
  });
};

export default errorHandler;
