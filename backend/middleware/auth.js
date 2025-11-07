export function registerFields(req, res, next) {
  const data = req.body;
  if (
    !data.login ||
    !data.username ||
    !data.email ||
    !data.password ||
    !data.confirm_password
  ) {
    return res.status(400).json({
      error: "All fields are required",
    });
  }
  if (data.password !== data.confirm_password) {
    return res.status(400).json({
      error: "Confirm password does not match password",
    });
  }
  next();
}
