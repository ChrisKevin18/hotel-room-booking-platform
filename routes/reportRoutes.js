const express = require("express");
const {
    getOccupancyReport,
    getRevenueReport
} = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Occupancy report (Admin only)
router.get(
    "/admin/reports/occupancy",
    protect,
    authorize("Admin"),
    getOccupancyReport
);

// Revenue report (Admin only)
router.get(
    "/admin/reports/revenue",
    protect,
    authorize("Admin"),
    getRevenueReport
);

module.exports = router;
