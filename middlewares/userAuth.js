const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "12345@abcd12";

const userAuth = (req, res, next) => {
  // Prefer token from HTTP-only cookie, fall back to Authorization header
  const tokenFromCookie = req.cookies && req.cookies.token;
  const authHeader = req.headers.authorization;

  let token = tokenFromCookie;
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(403).json({ error: true, message: "Access Denied: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userInfo = { id: decoded.id || decoded.userId || decoded._id, role: decoded.role };
    next();
  } catch (error) {
    res.status(401).json({ error: true, message: "Invalid or expired token" });
  }
};

module.exports = { userAuth };
