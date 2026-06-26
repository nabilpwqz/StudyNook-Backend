const { Schema } = require("mongoose");

const RoomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    floor: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: {
      type: [String],
      default: [],
      enum: ["Whiteboard", "Projector", "Wi-Fi", "Power Outlets", "Quiet Zone", "Air Conditioning"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingCount: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = { RoomSchema };
