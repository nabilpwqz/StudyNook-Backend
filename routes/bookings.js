const express = require("express");
const router = express.Router();
const { bookingController } = require("../controller/bookings");
const { userAuth } = require("../middlewares/userAuth");

// Private routes - require authentication
router.post("/", userAuth, bookingController.createBooking);
router.get("/my", userAuth, bookingController.getUserBookings);
router.get("/:id", userAuth, bookingController.getBookingById);
router.patch("/:id/cancel", userAuth, bookingController.cancelBooking);

module.exports = router;
