const express = require('express');
const WasteService = require('../models/WasteService');
const CollectionCalendar = require('../models/CollectionCalendar');
const ResidentRequest = require('../models/ResidentRequest');

const router = express.Router();

router.get('/', async (req, res) => {
  const [services, calendar, requests] = await Promise.all([
    WasteService.find().sort({ id: 1 }).lean(),
    CollectionCalendar.find().sort({ sdate: 1, servid: 1 }).lean(),
    ResidentRequest.find().sort({ demand: 1, sourceRow: 1 }).lean()
  ]);

  res.render('database', {
    title: 'Database',
    user: req.session.user,
    services,
    calendar,
    requests
  });
});

module.exports = router;