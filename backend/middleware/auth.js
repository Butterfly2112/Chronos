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

export function isAuthenticated(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: "Not authenticated. Please log in",
    });
  }
  next();
}

export function loginFields(req, res, next) {
  const data = req.body;
  if (!data.identifier || !data.password) {
    return res.status(400).json({
      error: "All firelds are required",
    });
  }
  next();
}

export function passwordReset(req, res, next) {
  const data = req.body;
  if (!data.password || !data.confirm_password || !data.token) {
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
