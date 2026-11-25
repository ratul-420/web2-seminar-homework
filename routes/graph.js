const express = require('express');
const WasteService = require('../models/WasteService');
const ResidentRequest = require('../models/ResidentRequest');

const router = express.Router();

router.get('/', async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.redirect('/login');
  }

  const [services, totals] = await Promise.all([
    WasteService.find().sort({ id: 1 }).lean(),
    ResidentRequest.aggregate([
      { $group: { _id: '$servid', quantity: { $sum: '$quantity' } } }
    ])
  ]);

  const quantityByService = new Map(totals.map(({ _id, quantity }) => [_id, quantity]));

  res.render('graph', {
    title: 'Waste Collection Graph',
    user,
    labels: services.map(({ wtype }) => wtype),
    quantities: services.map(({ id }) => quantityByService.get(id) ?? 0)
  });
});

module.exports = router;