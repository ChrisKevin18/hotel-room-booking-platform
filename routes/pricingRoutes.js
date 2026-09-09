const express = require("express");

const {
    createPricingRule,
    getPricingRules,
    updatePricingRule,
    deletePricingRule
} = require("../controllers/pricingController");

const { protect, authorize } = require("../middleware/authMiddleware");
const { pricing, objectIdParam } = require("../middleware/validate");

const router = express.Router();

router.post(
    "/admin/pricing-rules",
    protect,
    authorize("Admin"),
    pricing,
    createPricingRule
);

router.get(
    "/pricing-rules",
    protect,
    getPricingRules
);

router.put(
    "/admin/pricing-rules/:id",
    protect,
    authorize("Admin"),
    objectIdParam(),
    updatePricingRule
);

router.delete(
    "/admin/pricing-rules/:id",
    protect,
    authorize("Admin"),
    objectIdParam(),
    deletePricingRule
);

module.exports = router;