const express = require("express");

const {
    createRoomType,
    getRoomTypes
} = require("../controllers/roomTypeController");

const {
    createRoom,
    getRooms
} = require("../controllers/roomController");

const {
    searchAvailability
} = require("../controllers/availabilityController");

const { protect, authorize } = require("../middleware/authMiddleware");
const { roomType, room, objectIdParam } = require("../middleware/validate");

const router = express.Router();


// ROOM TYPE ROUTES

router.post(
    "/admin/room-types",
    protect,
    authorize("Admin"),
    roomType,
    createRoomType
);

router.get(
    "/room-types",
    getRoomTypes
);


// ROOM ROUTES

router.post(
    "/admin/rooms",
    protect,
    authorize("Admin"),
    room,
    createRoom
);

router.get(
    "/rooms",
    getRooms
);


// AVAILABILITY SEARCH

router.get(
    "/hotels/search",
    searchAvailability
);

module.exports = router;