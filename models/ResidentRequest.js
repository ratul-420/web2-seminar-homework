const mongoose = require('mongoose');

const residentRequestSchema = new mongoose.Schema({
  sourceRow: { type: Number, required: true, unique: true, min: 1 },
  demand: { type: Date, required: true },
  servid: { type: Number, required: true, min: 1 },
  quantity: { type: Number, required: true, min: 1 }
}, { collection: 'resident_requests' });

module.exports = mongoose.model('ResidentRequest', residentRequestSchema);