const express = require("express");

const {
    createBooking,
    getBooking,
    cancelBooking,
    getGuestBookings,
    updateBookingStatus,
    checkInBooking,
    checkOutBooking,
    getBookingInvoice
} = require("../controllers/bookingController");

const { protect, authorize } = require("../middleware/authMiddleware");
const { booking, status, objectIdParam } = require("../middleware/validate");

const router = express.Router();


// Create booking
router.post(
    "/bookings",
    protect,
    booking,
    createBooking
);


// Get booking
router.get(
    "/bookings/:id",
    protect,
    objectIdParam(),
    getBooking
);


// Cancel booking
router.put(
    "/bookings/:id/cancel",
    protect,
    objectIdParam(),
    cancelBooking
);


// Guest booking history
router.get(
    "/guests/:id/bookings",
    protect,
    objectIdParam(),
    getGuestBookings
);


// Update booking status
router.put(
    "/bookings/:id/status",
    protect,
    authorize("Admin", "Staff"),
    objectIdParam(),
    status,
    updateBookingStatus
);


// Member 4: Staff check-in
router.put(
    "/bookings/:id/checkin",
    protect,
    authorize("Staff", "Admin"),
    objectIdParam(),
    checkInBooking
);


// Member 4: Staff check-out
router.put(
    "/bookings/:id/checkout",
    protect,
    authorize("Staff", "Admin"),
    objectIdParam(),
    checkOutBooking
);


// Member 4: Invoice generation
router.get(
    "/bookings/:id/invoice",
    protect,
    objectIdParam(),
    getBookingInvoice
);


module.exports = router;