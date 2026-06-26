const express = require("express");
const router = express.Router();
const { roomController } = require("../controller/rooms");
const { userAuth } = require("../middlewares/userAuth");

// Public routes
router.get("/", roomController.getAllRooms);
router.get("/latest", roomController.getLatestRooms);
router.get("/:id", roomController.getRoomById);

// Private routes
router.post("/", userAuth, roomController.createRoom);
router.put("/:id", userAuth, roomController.updateRoom);
router.delete("/:id", userAuth, roomController.deleteRoom);
router.get("/user/listings", userAuth, roomController.getUserRooms);

module.exports = router;