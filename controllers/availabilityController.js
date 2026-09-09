const Room = require("../models/Room");
const Booking = require("../models/booking");

exports.searchAvailability = async (req, res) => {
    try {
        const { hotelId, roomTypeId, checkIn, checkOut } = req.query;

        if (!hotelId || !checkIn || !checkOut) {
            return res.status(400).json({
                success: false,
                error: "hotelId, checkIn and checkOut are required"
            });
        }

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                success: false,
                error: "Invalid check-in or check-out date"
            });
        }

        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                error: "Check-out date must be after check-in date"
            });
        }

        // Find bookings that overlap with the requested dates
        const overlappingBookings = await Booking.find({
            hotelId,
            status: {
                $in: ["RESERVED", "CONFIRMED", "CHECKED-IN"]
            },
            checkIn: { $lt: endDate },
            checkOut: { $gt: startDate }
        }).select("roomId");

        const bookedRoomIds = overlappingBookings.map(
            booking => booking.roomId
        );

        // Find rooms that are not booked for those dates
        const filter = {
            hotelId,
            status: { $in: ["available", "clean", "AVAILABLE", "CLEAN"] },
            _id: { $nin: bookedRoomIds }
        };

        if (roomTypeId) {
            filter.roomTypeId = roomTypeId;
        }

        const availableRooms = await Room.find(filter)
            .populate("hotelId")
            .populate("roomTypeId");

        res.status(200).json({
            success: true,
            count: availableRooms.length,
            data: availableRooms
        });

    } catch (error) {
        console.error("SEARCH AVAILABILITY ERROR:", error.message);

        res.status(500).json({
            success: false,
            error: "Server error while checking room availability"
        });
    }
};