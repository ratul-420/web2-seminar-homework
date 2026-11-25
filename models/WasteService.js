const mongoose = require('mongoose');

const wasteServiceSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, min: 1 },
  wtype: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true }
}, { id: false, collection: 'waste_services' });

module.exports = mongoose.model('WasteService', wasteServiceSchema);