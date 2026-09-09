const express = require("express");
const { updateHousekeeping } = require("../controllers/housekeepingController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { housekeeping, objectIdParam } = require("../middleware/validate");

const router = express.Router();

router.put(
  "/rooms/:id/housekeeping",
  protect,
  authorize("Staff", "Admin"),
  objectIdParam(),
  housekeeping,
  updateHousekeeping
);

module.exports = router;
