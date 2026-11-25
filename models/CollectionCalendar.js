const mongoose = require('mongoose');

const collectionCalendarSchema = new mongoose.Schema({
  sdate: { type: Date, required: true },
  servid: { type: Number, required: true, min: 1 }
}, { collection: 'collection_calendar' });

collectionCalendarSchema.index({ sdate: 1, servid: 1 }, { unique: true });

module.exports = mongoose.model('CollectionCalendar', collectionCalendarSchema);