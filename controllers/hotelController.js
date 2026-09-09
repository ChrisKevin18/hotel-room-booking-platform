const Hotel = require("../models/Hotel");

// GET ALL HOTELS
exports.getHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find();

        res.status(200).json({
            success: true,
            count: hotels.length,
            data: hotels
        });

    } catch (error) {
        console.error("GET HOTELS ERROR:", error.message);

        res.status(500).json({
            success: false,
            error: "Server error while fetching hotels"
        });
    }
};


// CREATE HOTEL
exports.createHotel = async (req, res) => {
    try {
        const { name, city, amenities, rating } = req.body;

        if (!name || !city || !amenities) {
            return res.status(400).json({
                success: false,
                error: "Name, city and amenities are required"
            });
        }

        const hotel = await Hotel.create({
            name,
            city,
            amenities,
            rating
        });

        res.status(201).json({
            success: true,
            message: "Hotel created successfully",
            data: hotel
        });

    } catch (error) {
        console.error("CREATE HOTEL ERROR:", error.message);

        res.status(500).json({
            success: false,
            error: "Server error while creating hotel"
        });
    }
};


// UPDATE HOTEL
exports.updateHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!hotel) {
            return res.status(404).json({
                success: false,
                error: "Hotel not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Hotel updated successfully",
            data: hotel
        });

    } catch (error) {
        console.error("UPDATE HOTEL ERROR:", error.message);

        res.status(500).json({
            success: false,
            error: "Server error while updating hotel"
        });
    }
};


// DELETE HOTEL
exports.deleteHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndDelete(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                error: "Hotel not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Hotel deleted successfully"
        });

    } catch (error) {
        console.error("DELETE HOTEL ERROR:", error.message);

        res.status(500).json({
            success: false,
            error: "Server error while deleting hotel"
        });
    }
};