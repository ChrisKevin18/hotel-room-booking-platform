const mongoose = require('mongoose');
const Room = require('../models/Room');

exports.updateHousekeeping = async (req,res) => {
  try {
    const room = await Room.findById(req.params.id);
    if(!room) return res.status(404).json({success:false,message:'Room not found',errorCode:'NOT_FOUND'});
    const target = req.body.status;
    const current = String(room.status || '').toUpperCase();
    const transitions = {
      OCCUPIED: ['DIRTY'],
      DIRTY: ['CLEANING'],
      CLEANING: ['CLEAN'],
      CLEAN: [],
      AVAILABLE: []
    };
    if(!transitions[current] || !transitions[current].includes(target)) {
      return res.status(409).json({success:false,message:`Invalid housekeeping transition: ${current || 'UNKNOWN'} -> ${target}`,errorCode:'WORKFLOW_CONFLICT'});
    }
    room.status = target.toLowerCase();
    room.housekeepingStatus = target;
    await room.save();
    res.json({success:true,message:'Housekeeping status updated',data:room});
  } catch(error){ res.status(500).json({success:false,message:'Server error while updating housekeeping status',errorCode:'INTERNAL_SERVER_ERROR'}); }
};
