const mongoose = require("mongoose");

const roomTypeSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    capacity: {
      type: Number,
      required: true,
      min: 1
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0
    },

    totalRooms: {
      type: Number,
      required: true,
      min: 1
    },

    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoomType", roomTypeSchema);