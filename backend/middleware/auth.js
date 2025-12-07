const availableCountryCodes = [
  "au",
  "at",
  "br",
  "bg",
  "ca",
  "cn",
  "hr",
  "cz",
  "dk",
  "fi",
  "fr",
  "de",
  "gb",
  "gr",
  "hk",
  "hu",
  "in",
  "id",
  "ie",
  "il",
  "it",
  "jp",
  "lv",
  "lt",
  "my",
  "mx",
  "nl",
  "nz",
  "no",
  "ph",
  "pl",
  "pt",
  "ro",
  "sa",
  "sg",
  "sk",
  "si",
  "kr",
  "es",
  "se",
  "tw",
  "tl",
  "tr",
  "ua",
  "us",
  "vn",
];

export function registerFields(req, res, next) {
  const { login, username, password, confirm_password, email, region } =
    req.body;
  if (!login || !username || !password || !confirm_password || !email) {
    return res.status(400).json({
      error: "All fields are required.",
    });
  }
  if (password !== confirm_password) {
    return res.status(400).json({
      error: "Passwords do not match.",
    });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: "Invalid email format.",
    });
  }
  if (login.length < 3 || login.length > 20) {
    return res.status(400).json({
      error: "Login must be between 3 and 20 characters.",
    });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(login)) {
    return res.status(400).json({
      error: "Login can only contain letters, numbers, and underscores.",
    });
  }
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({
      error: "Full name must be between 3 and 50 characters.",
    });
  }
  if (!/^[a-zA-Z\s\-']+$/.test(username)) {
    return res.status(400).json({
      error:
        "Full name can only contain letters, spaces, hyphens, and apostrophes.",
    });
  }
  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long.",
    });
  }
  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
    return res.status(400).json({
      error: "Password must contain at least one letter and one number.",
    });
  }
  if (region && !availableCountryCodes.includes(region)) {
    return res.status(400).json({
      error: "Invalid region code.",
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

  if (data.password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long.",
    });
  }

  if (!/(?=.*[A-Za-z])(?=.*\d)/.test(data.password)) {
    return res.status(400).json({
      error: "Password must contain at least one letter and one number.",
    });
  }

  next();
}
