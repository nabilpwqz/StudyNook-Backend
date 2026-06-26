const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { UserModel } = require("../model/UserModel");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "https://backend-s541.onrender.com/api/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return cb(new Error("Google account has no email"));
        }

        let user = await UserModel.findOne({ $or: [{ googleId: profile.id }, { email }] });

        if (!user) {
          const randomPassword = crypto.randomBytes(16).toString("hex");
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          user = new UserModel({
            name: profile.displayName || email.split("@")[0],
            email,
            password: hashedPassword,
            photoURL: profile.photos?.[0]?.value || "",
            googleId: profile.id,
            isGoogleUser: true,
          });
          await user.save();
        } else if (!user.googleId) {
          user.googleId = profile.id;
          user.isGoogleUser = true;
          if (!user.photoURL && profile.photos?.[0]?.value) {
            user.photoURL = profile.photos[0].value;
          }
          await user.save();
        }

        return cb(null, user);
      } catch (error) {
        return cb(error);
      }
    }
  )
);
