const PricingRule = require('../models/pricingRule');
const RoomType = require('../models/RoomType');

exports.createPricingRule = async (req,res) => {
  try {
    const data = { ...req.body };
    if (data.roomTypeId && !data.hotelId) {
      const rt = await RoomType.findById(data.roomTypeId);
      if (!rt) return res.status(404).json({success:false,message:'Room type not found',errorCode:'NOT_FOUND'});
      data.hotelId = rt.hotelId;
    }
    const pricingRule = await PricingRule.create(data);
    res.status(201).json({success:true,message:'Pricing rule created successfully',data:pricingRule});
  } catch(error) { res.status(400).json({success:false,message:error.message,errorCode:'VALIDATION_ERROR'}); }
};

exports.getPricingRules = async (req,res) => {
  try {
    const filter={};
    if(req.query.hotelId) filter.hotelId=req.query.hotelId;
    if(req.query.roomTypeId) filter.roomTypeId=req.query.roomTypeId;
    if(req.query.active!==undefined) filter.active=req.query.active==='true';
    const data=await PricingRule.find(filter).populate('hotelId').populate('roomTypeId');
    res.json({success:true,count:data.length,data});
  } catch(error){ res.status(500).json({success:false,message:'Server error while fetching pricing rules',errorCode:'INTERNAL_SERVER_ERROR'}); }
};

exports.updatePricingRule = async (req,res) => {
  try {
    const data={...req.body}; delete data._id; delete data.createdAt; delete data.updatedAt;
    const rule=await PricingRule.findByIdAndUpdate(req.params.id,data,{new:true,runValidators:true});
    if(!rule) return res.status(404).json({success:false,message:'Pricing rule not found',errorCode:'NOT_FOUND'});
    res.json({success:true,message:'Pricing rule updated successfully',data:rule});
  } catch(error){ res.status(400).json({success:false,message:error.message,errorCode:'VALIDATION_ERROR'}); }
};

exports.deletePricingRule = async (req,res) => {
  try { const rule=await PricingRule.findByIdAndDelete(req.params.id); if(!rule) return res.status(404).json({success:false,message:'Pricing rule not found',errorCode:'NOT_FOUND'}); res.json({success:true,message:'Pricing rule deleted successfully'}); }
  catch(error){ res.status(500).json({success:false,message:'Server error while deleting pricing rule',errorCode:'INTERNAL_SERVER_ERROR'}); }
};
