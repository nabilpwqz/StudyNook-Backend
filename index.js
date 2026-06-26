// Node v26 removed SlowBuffer; provide a small compatibility shim so
// older dependencies that reference `SlowBuffer.prototype` don't crash.
if (typeof global.SlowBuffer === "undefined") {
  global.SlowBuffer = Buffer;
}

const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const passport = require("passport");
const users = require("./routes/user.js");
const rooms = require("./routes/books.js");
const bookings = require("./routes/bookings.js");
const authGoogle = require("./routes/auth-google.js");
require("./config/passport");

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://studynook-app.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(passport.initialize());

// API Routes
app.use("/api/auth", authGoogle);
app.use("/api/auth", users);
app.use("/api/rooms", rooms);
app.use("/api/bookings", bookings);

app.get("/", (req, res) => {
  res.send("StudyNook API is running...");
});

const PORT = process.env.PORT || 5000;
const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.warn("Starting server without DB connection for local route testing.");
    app.listen(PORT, () => {
      console.log(`⚠️ Server running on port ${PORT} (no DB connection)`);
    });
  });