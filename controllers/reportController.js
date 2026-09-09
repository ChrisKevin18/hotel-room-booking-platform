const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Room = require("../models/Room");
const Hotel = require("../models/Hotel");

// ==========================================
// MEMBER 4: ADMIN OCCUPANCY REPORT
// ==========================================

exports.getOccupancyReport = async (req, res) => {
    try {
        const { hotelId, startDate, endDate } = req.query;

        // Hotel filter validation
        const roomFilter = {};
        const bookingFilter = {
            status: { $in: ["CONFIRMED", "CHECKED-IN"] }
        };

        if (hotelId) {
            if (!mongoose.Types.ObjectId.isValid(hotelId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid hotel ID"
                });
            }

            const hotelExists = await Hotel.findById(hotelId);
            if (!hotelExists) {
                return res.status(404).json({
                    success: false,
                    message: "Hotel not found"
                });
            }

            roomFilter.hotelId = new mongoose.Types.ObjectId(hotelId);
            bookingFilter.hotelId = new mongoose.Types.ObjectId(hotelId);
        }

        // Date range filtering
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date("2099-12-31");

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date format for startDate or endDate"
                });
            }

            if (start > end) {
                return res.status(400).json({
                    success: false,
                    message: "startDate must be before or equal to endDate"
                });
            }

            // Overlapping bookings: checkIn < end && checkOut > start
            bookingFilter.checkIn = { $lt: end };
            bookingFilter.checkOut = { $gt: start };
        }

        // 1. Total rooms
        const totalRooms = await Room.countDocuments(roomFilter);

        // 2. Occupied rooms: distinct rooms with active overlapping bookings
        const occupiedRoomIds = await Booking.distinct("roomId", bookingFilter);
        const occupiedRooms = occupiedRoomIds.length;

        // 3. Available rooms
        const availableRooms = Math.max(0, totalRooms - occupiedRooms);

        // 4. Safe occupancy percentage calculation (avoid division by zero)
        const occupancyPercentage =
            totalRooms > 0
                ? Number(((occupiedRooms / totalRooms) * 100).toFixed(2))
                : 0;

        res.status(200).json({
            success: true,
            report: {
                hotelId: hotelId || "all",
                dateRange: {
                    startDate: startDate || null,
                    endDate: endDate || null
                },
                totalRooms,
                occupiedRooms,
                availableRooms,
                occupancyPercentage
            }
        });

    } catch (error) {
        console.error("OCCUPANCY REPORT ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while generating occupancy report",
            error: error.message
        });
    }
};


// ==========================================
// MEMBER 4: ADMIN REVENUE REPORT
// ==========================================

exports.getRevenueReport = async (req, res) => {
    try {
        const { hotelId, startDate, endDate } = req.query;

        // Realized revenue only: DO NOT include CANCELLED bookings
        const match = {
            status: { $ne: "CANCELLED" }
        };

        if (hotelId) {
            if (!mongoose.Types.ObjectId.isValid(hotelId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid hotel ID"
                });
            }

            const hotelExists = await Hotel.findById(hotelId);
            if (!hotelExists) {
                return res.status(404).json({
                    success: false,
                    message: "Hotel not found"
                });
            }

            match.hotelId = new mongoose.Types.ObjectId(hotelId);
        }

        // Date range filtering
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date("2099-12-31");

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date format for startDate or endDate"
                });
            }

            if (start > end) {
                return res.status(400).json({
                    success: false,
                    message: "startDate must be before or equal to endDate"
                });
            }

            if (endDate) {
                end.setHours(23, 59, 59, 999);
            }

            match.createdAt = {
                $gte: start,
                $lte: end
            };
        }

        // Aggregation: Overall summary
        const summaryAgg = await Booking.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" },
                    taxes: { $sum: "$taxAmount" },
                    addOns: { $sum: "$addOnAmount" }
                }
            }
        ]);

        const totalBookings = summaryAgg[0]?.totalBookings || 0;
        const totalRevenue = Number((summaryAgg[0]?.totalRevenue || 0).toFixed(2));
        const taxes = Number((summaryAgg[0]?.taxes || 0).toFixed(2));
        const addOns = Number((summaryAgg[0]?.addOns || 0).toFixed(2));
        const roomRevenue = Number(Math.max(0, totalRevenue - taxes - addOns).toFixed(2));

        // Aggregation: Revenue by Hotel
        const revenueByHotel = await Booking.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$hotelId",
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" },
                    taxes: { $sum: "$taxAmount" },
                    addOns: { $sum: "$addOnAmount" }
                }
            },
            {
                $lookup: {
                    from: "hotels",
                    localField: "_id",
                    foreignField: "_id",
                    as: "hotel"
                }
            },
            {
                $project: {
                    hotelId: "$_id",
                    hotelName: { $ifNull: [{ $arrayElemAt: ["$hotel.name", 0] }, "Unknown Hotel"] },
                    totalBookings: 1,
                    totalRevenue: { $round: ["$totalRevenue", 2] },
                    taxes: { $round: ["$taxes", 2] },
                    addOns: { $round: ["$addOns", 2] },
                    roomRevenue: {
                        $round: [
                            { $subtract: ["$totalRevenue", { $add: ["$taxes", "$addOns"] }] },
                            2
                        ]
                    },
                    _id: 0
                }
            }
        ]);

        // Aggregation: Revenue by Date
        const revenueByDate = await Booking.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: "$_id",
                    totalBookings: 1,
                    totalRevenue: { $round: ["$totalRevenue", 2] },
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            success: true,
            report: {
                hotelId: hotelId || "all",
                dateRange: {
                    startDate: startDate || null,
                    endDate: endDate || null
                },
                totalBookings,
                totalRevenue,
                taxes,
                addOns,
                roomRevenue,
                revenueByHotel,
                revenueByDate
            }
        });

    } catch (error) {
        console.error("REVENUE REPORT ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while generating revenue report",
            error: error.message
        });
    }
};
