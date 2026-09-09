const mongoose = require('mongoose');
const pricingRuleSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['WEEKEND','DATE_RANGE','SEASON'], required: true },
  startDate: Date,
  endDate: Date,
  multiplier: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });
pricingRuleSchema.pre('validate', function(next){
  if(!this.hotelId && !this.roomTypeId) return next(new Error('Either hotelId or roomTypeId is required'));
  next();
});
pricingRuleSchema.index({ hotelId: 1, active: 1 });
pricingRuleSchema.index({ roomTypeId: 1, active: 1 });
module.exports = mongoose.model('PricingRule', pricingRuleSchema);
