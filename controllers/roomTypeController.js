const RoomType = require("../models/RoomType");

// CREATE ROOM TYPE
exports.createRoomType = async (req, res) => {
    try {
        const {
            hotelId,
            name,
            capacity,
            basePrice,
            totalRooms,
            description
        } = req.body;

        if (
            !hotelId ||
            !name ||
            capacity === undefined ||
            basePrice === undefined ||
            totalRooms === undefined
        ) {
            return res.status(400).json({
                success: false,
                error: "hotelId, name, capacity, basePrice and totalRooms are required"
            });
        }

        const roomType = await RoomType.create({
            hotelId,
            name,
            capacity,
            basePrice,
            totalRooms,
            description
        });

        res.status(201).json({
            success: true,
            message: "Room type created successfully",
            data: roomType
        });

    } catch (error) {
        console.error("CREATE ROOM TYPE ERROR:", error.message);

        res.status(500).json({
            success: false,
            error: "Server error while creating room type"
        });
    }
};


// GET ROOM TYPES
exports.getRoomTypes = async (req, res) => {
    try {
        const filter = {};

        if (req.query.hotelId) {
            filter.hotelId = req.query.hotelId;
        }

        const roomTypes = await RoomType.find(filter);

        res.status(200).json({
            success: true,
            count: roomTypes.length,
            data: roomTypes
        });

    } catch (error) {
        console.error("GET ROOM TYPES ERROR:", error.message);

        res.status(500).json({
            success: false,
            error: "Server error while fetching room types"
        });
    }
};