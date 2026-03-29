const authService = require("../services/auth.service");
const asyncHandler = require("../middleware/async-handler");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.login(email, password);

  if (!user)
    return res.status(401).json({ error: "Invalid credentials" });

  res.status(200).json(user);
});

module.exports = { login };
