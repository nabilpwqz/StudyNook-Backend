const { BookingModel } = require("../model/BookingModel");
const { RoomModel } = require("../model/RoomModel");
const { UserModel } = require("../model/UserModel");

const bookingController = {};

// Check for booking conflicts
const checkBookingConflict = async (roomId, date, startTime, endTime) => {
  const booking = await BookingModel.findOne({
    room: roomId,
    date: {
      $gte: new Date(date),
      $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
    },
    status: "confirmed",
    $or: [
      {
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } },
        ],
      },
    ],
  });

  return !!booking;
};

// Create booking (private route)
bookingController.createBooking = async (req, res) => {
  try {
    const { roomId, date, startTime, endTime, specialNote } = req.body;
    const userId = req.userInfo.id;

    // Validation
    if (!roomId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check room exists
    const room = await RoomModel.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Check for conflicts
    const hasConflict = await checkBookingConflict(roomId, date, startTime, endTime);
    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    // Calculate total cost
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    const hours = endHour - startHour;

    if (hours <= 0) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    const totalCost = hours * room.hourlyRate;

    // Create booking
    const newBooking = new BookingModel({
      user: userId,
      room: roomId,
      date: new Date(date),
      startTime,
      endTime,
      totalCost,
      specialNote: specialNote || "",
    });

    await newBooking.save();

    // Increment booking count
    await RoomModel.findByIdAndUpdate(roomId, { $inc: { bookingCount: 1 } });

    // Add booking to user's bookings array
    await UserModel.findByIdAndUpdate(userId, { $push: { bookings: newBooking._id } });

    res.status(201).json({
      success: true,
      message: "Room booked successfully",
      data: newBooking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating booking",
    });
  }
};

// Get user's bookings (private route)
bookingController.getUserBookings = async (req, res) => {
  try {
    const userId = req.userInfo.id;

    const bookings = await BookingModel.find({ user: userId })
      .populate("room", "name image floor capacity hourlyRate")
      .populate("user", "name email")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
    });
  }
};

// Get booking by ID
bookingController.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await BookingModel.findById(id)
      .populate("room")
      .populate("user");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching booking",
    });
  }
};

// Cancel booking (private route)
bookingController.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userInfo.id;

    const booking = await BookingModel.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check ownership
    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this booking",
      });
    }

    // Check if booking is in the future
    const bookingDate = new Date(booking.date);
    if (bookingDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel past bookings",
      });
    }

    // Update status
    booking.status = "cancelled";
    await booking.save();

    // Remove booking from user's bookings array
    await UserModel.findByIdAndUpdate(userId, { $pull: { bookings: id } });

    // Optionally decrement booking count
    await RoomModel.findByIdAndUpdate(booking.room, { $inc: { bookingCount: -1 } });

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error cancelling booking",
    });
  }
};

module.exports = { bookingController };
