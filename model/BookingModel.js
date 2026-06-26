const { model } = require("mongoose");
const { BookingSchema } = require("../schemas/BookingSchema");

const BookingModel = new model("Booking", BookingSchema);

module.exports = { BookingModel };
