const { Schema } = require("mongoose");

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    photoURL: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      default: null,
    },
    isGoogleUser: {
      type: Boolean,
      default: false,
    },
    bookings: [
      {
        type: Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = { UserSchema };
