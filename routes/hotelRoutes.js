const express = require('express');
const { getHotels, createHotel, updateHotel, deleteHotel } = require('../controllers/hotelController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { hotel, objectIdParam } = require('../middleware/validate');

const router = express.Router();

// Public route
router.get('/hotels', getHotels);

// Admin routes
router.post('/admin/hotels', protect, authorize('Admin'), hotel, createHotel);
router.put('/admin/hotels/:id', protect, authorize('Admin'), objectIdParam(), hotel, updateHotel);
router.delete('/admin/hotels/:id', protect, authorize('Admin'), objectIdParam(), deleteHotel);

module.exports = router;
