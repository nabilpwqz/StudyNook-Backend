const {Schema} = require("mongoose");

const BookSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: { type: String },
    floor: { type: String, default: "" },
    capacity: { type: Number, default: 1 },
    hourlyRate: { type: Number, default: 0 },
    amenities: [{ type: String }],
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}) 

module.exports = {BookSchema};