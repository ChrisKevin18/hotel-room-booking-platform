const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true
    },

    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
      required: true
    },

    roomNumber: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: [
        "available",
        "occupied",
        "maintenance",
        "dirty",
        "cleaning",
        "clean",
        "AVAILABLE",
        "OCCUPIED",
        "MAINTENANCE",
        "DIRTY",
        "CLEANING",
        "CLEAN"
      ],
      default: "available"
    },

    housekeepingStatus: {
      type: String,
      enum: ["DIRTY", "CLEANING", "CLEAN", "dirty", "cleaning", "clean", null],
      default: null
    }
  },
  { timestamps: true }
);

// Prevent duplicate room numbers in the same hotel
roomSchema.index(
  { hotelId: 1, roomNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("Room", roomSchema);