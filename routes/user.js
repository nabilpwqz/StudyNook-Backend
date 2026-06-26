const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/userAuth");
const { userController } = require("../controller/studynook-user");

// Public routes
router.post("/register", userController.register);
router.post("/login", userController.login);

// Private routes
router.get("/profile", userAuth, userController.getProfile);
router.post("/logout", userAuth, userController.logout);

module.exports = router;