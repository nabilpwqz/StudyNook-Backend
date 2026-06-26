const { Schema } = require("mongoose");

const BookingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):00$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):00$/,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    specialNote: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  {
    timestamps: true,
  }
);

// Index to prevent double bookings
BookingSchema.index(
  { room: 1, date: 1, startTime: 1, status: 1 },
  { sparse: true }
);

module.exports = { BookingSchema };
