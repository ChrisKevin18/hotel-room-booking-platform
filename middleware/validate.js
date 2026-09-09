const mongoose = require('mongoose');

const fail = (res, message) => res.status(400).json({ success:false, message, errorCode:'VALIDATION_ERROR' });
const isDate = v => v && !Number.isNaN(new Date(v).getTime());
const isObjectId = v => mongoose.Types.ObjectId.isValid(v);

exports.register = (req,res,next) => {
  const {name,email,password}=req.body||{};
  if(!name || !email || !/^\S+@\S+\.\S+$/.test(email) || !password || String(password).length < 6) return fail(res,'name, valid email and password (minimum 6 characters) are required');
  next();
};
exports.login = (req,res,next) => {
  const {email,password}=req.body||{};
  if(!email || !password) return fail(res,'email and password are required'); next();
};
exports.objectIdParam = (param='id') => (req,res,next) => isObjectId(req.params[param]) ? next() : fail(res,`Invalid ${param}`);
exports.hotel = (req,res,next) => {
  const {name,city,amenities,rating}=req.body||{};
  if(!name || !city || !Array.isArray(amenities) || (rating !== undefined && (Number(rating)<1 || Number(rating)>5))) return fail(res,'name, city and amenities[] are required; rating must be 1-5'); next();
};
exports.roomType = (req,res,next) => {
  const {hotelId,name,capacity,basePrice,totalRooms}=req.body||{};
  if(!isObjectId(hotelId)||!name||Number(capacity)<1||Number(basePrice)<0||Number(totalRooms)<1) return fail(res,'hotelId, name, capacity, basePrice and totalRooms are required and valid'); next();
};
exports.room = (req,res,next) => {
  const {hotelId,roomTypeId,roomNumber}=req.body||{};
  if(!isObjectId(hotelId)||!isObjectId(roomTypeId)||!roomNumber) return fail(res,'hotelId, roomTypeId and roomNumber are required'); next();
};
exports.booking = (req,res,next) => {
  const {roomId,checkIn,checkOut,addOns=[]}=req.body||{};
  if(!isObjectId(roomId)||!isDate(checkIn)||!isDate(checkOut)||new Date(checkOut)<=new Date(checkIn)||!Array.isArray(addOns)) return fail(res,'roomId, valid checkIn/checkOut dates and addOns[] are required; checkOut must be after checkIn');
  if(addOns.some(a=>!a || !a.name || Number(a.price)<0)) return fail(res,'Each add-on requires name and a non-negative price'); next();
};
exports.status = (req,res,next) => ['RESERVED','CONFIRMED','CHECKED-IN','CHECKED-OUT','CANCELLED'].includes(req.body?.status) ? next() : fail(res,'Invalid booking status');
exports.housekeeping = (req,res,next) => ['DIRTY','CLEANING','CLEAN'].includes(req.body?.status) ? next() : fail(res,'status must be one of DIRTY, CLEANING, CLEAN');
exports.pricing = (req,res,next) => {
  const {hotelId,roomTypeId,name,type,multiplier,startDate,endDate}=req.body||{};
  if((!hotelId&&!roomTypeId)||!name||!['WEEKEND','DATE_RANGE','SEASON'].includes(type)||Number(multiplier)<0) return fail(res,'hotelId or roomTypeId, name, valid type and non-negative multiplier are required');
  if((type!=='WEEKEND') && (!isDate(startDate)||!isDate(endDate)||new Date(endDate)<new Date(startDate))) return fail(res,'DATE_RANGE/SEASON rules require valid startDate and endDate'); next();
};
