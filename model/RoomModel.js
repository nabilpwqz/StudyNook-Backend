const { model } = require("mongoose");
const { RoomSchema } = require("../schemas/RoomSchema");

const RoomModel = new model("Room", RoomSchema);

module.exports = { RoomModel };
