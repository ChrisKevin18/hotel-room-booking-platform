const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Room = require("../models/Room");
const RoomType = require("../models/RoomType");
const PricingRule = require("../models/pricingRule");


// Calculate number of nights
const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const difference = end - start;

    return Math.ceil(
        difference / (1000 * 60 * 60 * 24)
    );
};


// Get pricing multiplier
const getPricingMultiplier = async (hotelId, date, roomTypeId = null) => {

    const filter = roomTypeId ? { $or: [{ roomTypeId }, { hotelId, roomTypeId: { $exists: false } }, { hotelId, roomTypeId: null }] } : { hotelId };
    const rules = await PricingRule.find({ ...filter, active: true });

    let multiplier = 1;

    const currentDate = new Date(date);

    for (const rule of rules) {

        // Weekend pricing
        if (rule.type === "WEEKEND") {

            const day = currentDate.getDay();

            if (day === 0 || day === 6) {
                multiplier = Math.max(
                    multiplier,
                    rule.multiplier
                );
            }
        }


        // Date range / seasonal pricing
        if (
            rule.type === "DATE_RANGE" ||
            rule.type === "SEASON"
        ) {

            if (
                rule.startDate &&
                rule.endDate &&
                currentDate >= new Date(rule.startDate) &&
                currentDate <= new Date(rule.endDate)
            ) {

                multiplier = Math.max(
                    multiplier,
                    rule.multiplier
                );
            }
        }
    }

    return multiplier;
};


// ==========================================
// CREATE BOOKING
// ==========================================

exports.createBooking = async (req, res) => {

    try {

        const {
            roomId,
            checkIn,
            checkOut,
            addOns = []
        } = req.body;


        // Validate dates
        const start = new Date(checkIn);
        const end = new Date(checkOut);


        if (isNaN(start) || isNaN(end)) {

            return res.status(400).json({
                message: "Invalid check-in or check-out date"
            });
        }


        if (end <= start) {

            return res.status(400).json({
                message:
                    "Check-out date must be after check-in date"
            });
        }


        // Find room
        const room = await Room.findById(roomId);


        if (!room) {

            return res.status(404).json({
                message: "Room not found"
            });
        }


        // Check maintenance
        if (room.status === "maintenance") {

            return res.status(400).json({
                message:
                    "Room is currently under maintenance"
            });
        }


        // Check overlapping bookings
        const conflictingBooking =
            await Booking.findOne({

                roomId,

                status: {
                    $in: [
                        "RESERVED",
                        "CONFIRMED",
                        "CHECKED-IN"
                    ]
                },

                checkIn: {
                    $lt: end
                },

                checkOut: {
                    $gt: start
                }
            });


        if (conflictingBooking) {

            return res.status(409).json({
                message:
                    "Room is already booked for the selected dates"
            });
        }


        // Find room type
        const roomType =
            await RoomType.findById(
                room.roomTypeId
            );


        if (!roomType) {

            return res.status(404).json({
                message: "Room type not found"
            });
        }


        // Calculate nights
        const numberOfNights =
            calculateNights(
                checkIn,
                checkOut
            );


        // Calculate room price
        let totalRoomAmount = 0;

        let firstNightMultiplier = 1;


        for (
            let i = 0;
            i < numberOfNights;
            i++
        ) {

            const currentDate =
                new Date(start);

            currentDate.setDate(
                currentDate.getDate() + i
            );


            const multiplier =
                await getPricingMultiplier(
                    room.hotelId,
                    currentDate
                );


            if (i === 0) {
                firstNightMultiplier =
                    multiplier;
            }


            totalRoomAmount +=
                roomType.basePrice * multiplier;
        }


        // Calculate add-ons
        const addOnAmount =
            addOns.reduce(
                (total, addon) =>
                    total + Number(addon.price || 0),
                0
            );


        // Calculate tax
        const TAX_RATE = 0.05;

        const subtotal =
            totalRoomAmount + addOnAmount;

        const taxAmount =
            subtotal * TAX_RATE;


        // Final amount
        const totalAmount =
            subtotal + taxAmount;


        // Get logged-in guest
        const guestId =
            req.user._id || req.user.id;


        // Create booking
        const booking =
            await Booking.create({

                guestId,

                hotelId: room.hotelId,

                roomId: room._id,

                roomTypeId: room.roomTypeId,

                checkIn: start,

                checkOut: end,

                numberOfNights,

                basePricePerNight:
                    roomType.basePrice,

                finalPricePerNight:
                    roomType.basePrice *
                    firstNightMultiplier,

                taxAmount,

                addOns,

                addOnAmount,

                totalAmount,

                status: "RESERVED"
            });


        res.status(201).json({

            message:
                "Booking created successfully",

            booking
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Server error",

            error: error.message
        });
    }
};


// ==========================================
// GET SINGLE BOOKING
// ==========================================

exports.getBooking = async (req, res) => {

    try {

        const booking =
            await Booking.findById(
                req.params.id
            )
            .populate(
                "guestId",
                "name email"
            )
            .populate("roomId")
            .populate("roomTypeId")
            .populate("hotelId");


        if (!booking) {
            return res.status(404).json({ success:false, message:"Booking not found", errorCode:"NOT_FOUND" });
        }
        if (req.user.role === "Guest" && booking.guestId._id?.toString() !== (req.user._id || req.user.id).toString() && booking.guestId.toString() !== (req.user._id || req.user.id).toString()) {
            return res.status(403).json({ success:false, message:"Not authorized to access this booking", errorCode:"FORBIDDEN" });
        }
        res.json({success:true, data:booking});


    } catch (error) {

        res.status(500).json({

            message: "Server error",

            error: error.message
        });
    }
};


// ==========================================
// CANCEL BOOKING
// ==========================================

exports.cancelBooking = async (req, res) => {

    try {

        const booking =
            await Booking.findById(
                req.params.id
            );


        if (!booking) {
            return res.status(404).json({ success:false, message:"Booking not found", errorCode:"NOT_FOUND" });
        }
        if (req.user.role === "Guest" && booking.guestId.toString() !== (req.user._id || req.user.id).toString()) {
            return res.status(403).json({ success:false, message:"Not authorized to cancel this booking", errorCode:"FORBIDDEN" });
        }

        // Only reserved/confirmed bookings
        // can be cancelled
        if (
            booking.status !== "RESERVED" &&
            booking.status !== "CONFIRMED"
        ) {

            return res.status(400).json({

                message:
                    "Only reserved or confirmed bookings can be cancelled"
            });
        }


        const now = new Date();


        const difference =
            new Date(booking.checkIn) - now;


        const daysBeforeCheckIn =
            Math.ceil(
                difference /
                (1000 * 60 * 60 * 24)
            );


        // Cancellation policy
        let refundPercentage;


        if (daysBeforeCheckIn > 7) {

            refundPercentage = 100;

        } else if (daysBeforeCheckIn >= 3) {

            refundPercentage = 50;

        } else {

            refundPercentage = 0;
        }


        const refundAmount =
            booking.totalAmount *
            refundPercentage /
            100;


        booking.status = "CANCELLED";

        booking.cancellationReason =
            req.body.reason ||
            "Guest requested cancellation";

        booking.refundAmount =
            refundAmount;


        await booking.save();


        res.json({

            message:
                "Booking cancelled successfully",

            bookingId:
                booking._id,

            status:
                booking.status,

            refundPercentage,

            refundAmount
        });


    } catch (error) {

        res.status(500).json({

            message: "Server error",

            error: error.message
        });
    }
};


// ==========================================
// GUEST BOOKING HISTORY
// ==========================================

exports.getGuestBookings = async (req, res) => {

    try {
        const currentUserId = (req.user._id || req.user.id).toString();
        if (req.user.role === "Guest" && currentUserId !== req.params.id) {
            return res.status(403).json({ success:false, message:"Not authorized to access another guest's booking history", errorCode:"FORBIDDEN" });
        }

        const bookings =
            await Booking.find({
                guestId: req.params.id
            })
            .populate("roomId")
            .populate("roomTypeId")
            .populate("hotelId")
            .sort({
                createdAt: -1
            });


        res.json({

            count: bookings.length,

            bookings
        });


    } catch (error) {

        res.status(500).json({

            message: "Server error",

            error: error.message
        });
    }
};


// ==========================================
// UPDATE BOOKING STATUS
// ==========================================

exports.updateBookingStatus = async (
    req,
    res
) => {

    try {

        const { status } = req.body;





        const booking =
            await Booking.findById(
                req.params.id
            );


        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found", errorCode: "NOT_FOUND" });
        }

        const transitions = {
            RESERVED: ["CONFIRMED", "CANCELLED"],
            CONFIRMED: ["CHECKED-IN", "CANCELLED"],
            "CHECKED-IN": ["CHECKED-OUT"],
            "CHECKED-OUT": [],
            CANCELLED: []
        };
        if (!transitions[booking.status].includes(status)) {
            return res.status(409).json({ success:false, message:`Invalid booking transition: ${booking.status} -> ${status}`, errorCode:"WORKFLOW_CONFLICT" });
        }

        booking.status = status;

        await booking.save();


        res.json({

            message:
                "Booking status updated successfully",

            booking
        });


    } catch (error) {

        res.status(500).json({

            message: "Server error",

            error: error.message
        });
    }
};


// ==========================================
// MEMBER 4: STAFF CHECK-IN
// ==========================================

exports.checkInBooking = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Verify booking status
        if (booking.status === "CHECKED-IN") {
            return res.status(400).json({
                success: false,
                message: "Booking is already checked in"
            });
        }

        if (booking.status === "CHECKED-OUT") {
            return res.status(400).json({
                success: false,
                message: "Booking has already checked out"
            });
        }

        if (booking.status === "CANCELLED") {
            return res.status(400).json({
                success: false,
                message: "Cannot check in a cancelled booking"
            });
        }

        if (booking.status !== "CONFIRMED" && booking.status !== "RESERVED") {
            return res.status(400).json({
                success: false,
                message: "Booking is not in an appropriate status for check-in"
            });
        }

        // Validate check-in date
        const now = new Date();
        const checkOutDate = new Date(booking.checkOut);

        if (now > checkOutDate) {
            return res.status(400).json({
                success: false,
                message: "Check-out date has already passed for this booking"
            });
        }

        // Find room
        const room = await Room.findById(booking.roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Associated room not found"
            });
        }

        const roomStatusUpper = (room.status || "").toUpperCase();

        if (roomStatusUpper === "OCCUPIED") {
            return res.status(400).json({
                success: false,
                message: "Room is already occupied"
            });
        }

        if (roomStatusUpper === "MAINTENANCE") {
            return res.status(400).json({
                success: false,
                message: "Room is currently under maintenance"
            });
        }

        if (roomStatusUpper === "DIRTY" || roomStatusUpper === "CLEANING") {
            return res.status(400).json({
                success: false,
                message: "Room is not ready for check-in (requires housekeeping)"
            });
        }

        // Record actual check-in timestamp
        const actualCheckIn = req.body.actualCheckInTime
            ? new Date(req.body.actualCheckInTime)
            : new Date();

        booking.actualCheckInTime = actualCheckIn;
        booking.status = "CHECKED-IN";

        room.status = "OCCUPIED";
        room.housekeepingStatus = null;

        await booking.save();
        await room.save();

        res.status(200).json({
            success: true,
            message: "Guest checked in successfully",
            booking,
            room
        });

    } catch (error) {
        console.error("CHECK-IN ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error during check-in",
            error: error.message
        });
    }
};


// ==========================================
// MEMBER 4: STAFF CHECK-OUT
// ==========================================

exports.checkOutBooking = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Only allow checkout when status is CHECKED-IN
        if (booking.status !== "CHECKED-IN") {
            return res.status(400).json({
                success: false,
                message: `Cannot checkout booking with status ${booking.status}. Only CHECKED-IN bookings can be checked out.`
            });
        }

        const room = await Room.findById(booking.roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Associated room not found"
            });
        }

        // Record actual check-out timestamp
        const actualCheckOut = req.body.actualCheckOutTime
            ? new Date(req.body.actualCheckOutTime)
            : new Date();

        booking.actualCheckOutTime = actualCheckOut;
        booking.status = "CHECKED-OUT";

        room.status = "DIRTY";
        room.housekeepingStatus = "DIRTY";

        await booking.save();
        await room.save();

        res.status(200).json({
            success: true,
            message: "Guest checked out successfully",
            booking,
            room
        });

    } catch (error) {
        console.error("CHECKOUT ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error during checkout",
            error: error.message
        });
    }
};


// ==========================================
// MEMBER 4: INVOICE GENERATION
// ==========================================

exports.getBookingInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Authorization check: Guest can only view their own invoice
        const currentUserId = (req.user._id || req.user.id).toString();
        if (
            req.user.role === "Guest" &&
            booking.guestId.toString() !== currentUserId
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to access another guest's invoice"
            });
        }

        // Calculate breakdown
        const numberOfNights =
            booking.numberOfNights ||
            calculateNights(booking.checkIn, booking.checkOut);

        const basePricePerNight = booking.basePricePerNight || 0;
        const roomCost = numberOfNights * basePricePerNight;
        const addOns = booking.addOnAmount || 0;
        const tax = booking.taxAmount || 0;
        const totalAmount = booking.totalAmount || 0;

        // Dynamic pricing adjustment = (totalAmount - tax - addOns) - base room cost
        const roomTotalBeforeTax = totalAmount - tax - addOns;
        const dynamicPricing = Math.max(
            0,
            Math.round((roomTotalBeforeTax - roomCost) * 100) / 100
        );

        res.status(200).json({
            success: true,
            invoice: {
                bookingId: booking._id,
                guestId: booking.guestId,
                roomId: booking.roomId,
                hotelId: booking.hotelId,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                numberOfNights,
                roomCost: Number(roomCost.toFixed(2)),
                dynamicPricing: Number(dynamicPricing.toFixed(2)),
                addOns: Number(addOns.toFixed(2)),
                tax: Number(tax.toFixed(2)),
                totalAmount: Number(totalAmount.toFixed(2)),
                status: booking.status,
                actualCheckInTime: booking.actualCheckInTime || null,
                actualCheckOutTime: booking.actualCheckOutTime || null
            }
        });

    } catch (error) {
        console.error("INVOICE ERROR:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error while generating invoice",
            error: error.message
        });
    }
};