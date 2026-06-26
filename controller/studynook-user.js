const { UserModel } = require("../model/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "12345@abcd12";

const userController = {};

// User Registration
userController.register = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password;
    const photoURL = req.body.photoURL?.trim();

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      photoURL: photoURL || "",
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Registration successful! Please login.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
    });
  }
};

// User Login
userController.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
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

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
    });
  }
};

// Get user profile
userController.getProfile = async (req, res) => {
  try {
    const userId = req.userInfo.id;

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
};

// Logout
userController.logout = async (req, res) => {
  try {
    const isSecureCookie = req.secure || req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: isSecureCookie ? "none" : "lax",
    });
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error logging out",
    });
  }
};

module.exports = { userController };
