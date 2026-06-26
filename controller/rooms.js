const { RoomModel } = require("../model/RoomModel");
const { UserModel } = require("../model/UserModel");

const roomController = {};

// Get all rooms with search and filter
roomController.getAllRooms = async (req, res) => {
  try {
    const { search, amenities } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (amenities) {
      const amenitiesArray = amenities.split(",");
      query.amenities = { $in: amenitiesArray };
    }

    const rooms = await RoomModel.find(query)
      .populate("owner", "name photoURL")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching rooms",
    });
  }
};

// Get latest 6 rooms for homepage
roomController.getLatestRooms = async (req, res) => {
  try {
    const rooms = await RoomModel.find()
      .populate("owner", "name photoURL")
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching latest rooms",
    });
  }
};

// Get room by ID
roomController.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await RoomModel.findById(id).populate("owner", "name photoURL email");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching room",
    });
  }
};

// Create room (private route)
roomController.createRoom = async (req, res) => {
  try {
    const { name, description, image, floor, capacity, hourlyRate, amenities } = req.body;
    const userId = req.userInfo.id;

    // Validation
    if (!name || !description || !image || !floor || !capacity || hourlyRate === undefined) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newRoom = new RoomModel({
      name,
      description,
      image,
      floor,
      capacity: parseInt(capacity),
      hourlyRate: parseFloat(hourlyRate),
      amenities: amenities || [],
      owner: userId,
    });

    await newRoom.save();

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: newRoom,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating room",
    });
  }
};

// Update room (owner only)
roomController.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, floor, capacity, hourlyRate, amenities } = req.body;
    const userId = req.userInfo.id;

    const room = await RoomModel.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Check ownership
    if (room.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this room",
      });
    }

    // Update fields
    if (name) room.name = name;
    if (description) room.description = description;
    if (image) room.image = image;
    if (floor) room.floor = floor;
    if (capacity) room.capacity = parseInt(capacity);
    if (hourlyRate !== undefined) room.hourlyRate = parseFloat(hourlyRate);
    if (amenities) room.amenities = amenities;

    await room.save();

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating room",
    });
  }
};

// Delete room (owner only)
roomController.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userInfo.id;

    const room = await RoomModel.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Check ownership
    if (room.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this room",
      });
    }

    // Delete room
    await RoomModel.findByIdAndDelete(id);

    // Remove room from bookings (if any)
    // Could also remove bookings that reference this room

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting room",
    });
  }
};

// Get user's rooms (my listings)
roomController.getUserRooms = async (req, res) => {
  try {
    const userId = req.userInfo.id;
    const rooms = await RoomModel.find({ owner: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching your rooms",
    });
  }
};

module.exports = { roomController };
