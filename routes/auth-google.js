const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { UserModel } = require("../model/UserModel");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "12345@abcd12";
const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";

router.get("/google", (req, res, next) => {
  const redirectUri = req.query.redirect_uri || process.env.CLIENT_URL || "http://localhost:5173";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: encodeURIComponent(redirectUri),
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${frontendUrl}/login?googleError=true`,
  }),
  async (req, res) => {
    try {
      const user = req.user;
      const token = jwt.sign(
        { id: user._id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const isSecureCookie = req.secure || req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";
      res.cookie("token", token, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: isSecureCookie ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      const state = req.query.state ? decodeURIComponent(req.query.state) : null;
      const redirectUri = state || frontendUrl;
      res.redirect(`${redirectUri}/login?googleSuccess=true`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/login?googleError=true`);
    }
  }
);

module.exports = router;
