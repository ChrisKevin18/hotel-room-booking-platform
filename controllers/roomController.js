const mongoose = require("mongoose");
const Room = require("../models/Room");


// CREATE ROOM
exports.createRoom = async (req, res) => {
    try {
        const {
            hotelId,
            roomTypeId,
            roomNumber,
            status
        } = req.body;

        if (!hotelId || !roomTypeId || !roomNumber) {
            return res.status(400).json({
                success: false,
                error: "hotelId, roomTypeId and roomNumber are required"
            });
        }

        const existingRoom = await Room.findOne({
            hotelId,
            roomNumber
        });

        if (existingRoom) {
            return res.status(400).json({
                success: false,
                error: "Room number already exists in this hotel"
            });
        }

        const room = await Room.create({
            hotelId,
            roomTypeId,
            roomNumber,
            status: status || "available"
        });

        res.status(201).json({
            success: true,
            message: "Room created successfully",
            data: room
        });

    } catch (error) {
        console.error("CREATE ROOM ERROR:", error.message);

        res.status(500).json({
            success: false,
            error: "Server error while creating room"
        });
    }
};


// GET ROOMS
exports.getRooms = async (req, res) => {
    try {
        const filter = {};

        if (req.query.hotelId) {
            filter.hotelId = req.query.hotelId;
        }

        if (req.query.roomTypeId) {
            filter.roomTypeId = req.query.roomTypeId;
        }

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const rooms = await Room.find(filter)
            .populate("hotelId")
            .populate("roomTypeId");

        res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms
        });

    } catch (error) {
        console.error("GET ROOMS ERROR:", error.message);

        res.status(500).json({
            success: false,
            error: "Server error while fetching rooms"
        });
    }
};


// ==========================================
// MEMBER 4: UPDATE HOUSEKEEPING STATUS
// ==========================================

exports.updateHousekeepingStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid room ID"
            });
        }

        const room = await Room.findById(id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        const rawStatus = req.body.status || req.body.housekeepingStatus;

        if (!rawStatus) {
            return res.status(400).json({
                success: false,
                message: "Housekeeping status is required"
            });
        }

        const target = rawStatus.toString().trim().toUpperCase();
        const allowedStatuses = ["DIRTY", "CLEANING", "CLEAN"];

        if (!allowedStatuses.includes(target)) {
            return res.status(400).json({
                success: false,
                message: "Invalid housekeeping status. Allowed values: DIRTY, CLEANING, CLEAN"
            });
        }

        const current = (room.status || "").toUpperCase();

        // Lifecycle enforcement: OCCUPIED -> DIRTY -> CLEANING -> CLEAN
        if (current === "OCCUPIED" && target !== "DIRTY") {
            return res.status(400).json({
                success: false,
                message: `Cannot transition occupied room directly to ${target}. Room must be DIRTY first.`
            });
        }

        if (current === "DIRTY" && target === "CLEAN") {
            return res.status(400).json({
                success: false,
                message: "Invalid transition. DIRTY room must be set to CLEANING before it can be marked CLEAN."
            });
        }

        if ((current === "CLEAN" || current === "AVAILABLE") && target === "CLEANING") {
            return res.status(400).json({
                success: false,
                message: "Room is already clean. It must be DIRTY before cleaning."
            });
        }

        // Apply new status
        if (target === "CLEAN") {
            room.status = "clean";
            room.housekeepingStatus = "CLEAN";
        } else if (target === "CLEANING") {
            room.status = "cleaning";
            room.housekeepingStatus = "CLEANING";
        } else if (target === "DIRTY") {
            room.status = "dirty";
            room.housekeepingStatus = "DIRTY";
        }

        await room.save();

        res.status(200).json({
            success: true,
            message: `Room housekeeping status updated to ${target}`,
            room
        });

    } catch (error) {
        console.error("HOUSEKEEPING ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while updating housekeeping status",
            error: error.message
        });
    }
};