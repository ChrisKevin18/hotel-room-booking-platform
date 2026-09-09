const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },

    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
      required: true
    },

    checkIn: {
      type: Date,
      required: true
    },

    checkOut: {
      type: Date,
      required: true
    },

    numberOfNights: {
      type: Number,
      required: true,
      min: 1
    },

    basePricePerNight: {
      type: Number,
      required: true,
      min: 0
    },

    finalPricePerNight: {
      type: Number,
      required: true,
      min: 0
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    addOns: [
      {
        name: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],

    addOnAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: [
        "RESERVED",
        "CONFIRMED",
        "CHECKED-IN",
        "CHECKED-OUT",
        "CANCELLED"
      ],
      default: "RESERVED"
    },

    cancellationReason: {
      type: String,
      trim: true
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Member 4 tracking fields
    actualCheckInTime: {
      type: Date
    },

    actualCheckOutTime: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
