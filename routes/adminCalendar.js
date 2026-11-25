const express = require('express');
const CollectionCalendar = require('../models/CollectionCalendar');
const WasteService = require('../models/WasteService');

const router = express.Router();
const calendarUrl = '/admin/calendar';

async function validateEntry(req, res, next) {
  const { sdate, servid } = req.body ?? {};

  if (typeof sdate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(sdate)) {
    return res.status(400).send('Enter a collection date in YYYY-MM-DD format.');
  }

  const date = new Date(`${sdate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== sdate) {
    return res.status(400).send('Enter a valid collection date.');
  }

  if (typeof servid !== 'string' || !/^[1-9]\d*$/.test(servid)) {
    return res.status(400).send('Enter an existing service ID.');
  }

  const serviceId = Number(servid);
  if (!Number.isSafeInteger(serviceId) || !(await WasteService.exists({ id: serviceId }))) {
    return res.status(400).send('Enter an existing service ID.');
  }

  res.locals.calendarEntry = { sdate: date, servid: serviceId };
  return next();
}

router.param('id', (req, res, next, id) => {
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return res.status(404).send('Calendar entry not found.');
  }
  return next();
});

router.get('/', async (req, res) => {
  const entries = await CollectionCalendar.find()
    .sort({ sdate: 1, servid: 1 })
    .lean();

  res.render('admin-calendar', {
    title: 'Manage Collection Calendar',
    user: req.session.user,
    entries
  });
});

router.post('/', validateEntry, async (req, res) => {
  await CollectionCalendar.create(res.locals.calendarEntry);
  return res.redirect(303, calendarUrl);
});

router.get('/:id/edit', async (req, res) => {
  const entry = await CollectionCalendar.findById(req.params.id).lean();
  if (!entry) {
    return res.status(404).send('Calendar entry not found.');
  }

  return res.render('admin-calendar-edit', {
    title: 'Edit Collection',
    user: req.session.user,
    entry
  });
});

router.post('/:id/edit', validateEntry, async (req, res) => {
  const result = await CollectionCalendar.updateOne(
    { _id: req.params.id },
    { $set: res.locals.calendarEntry },
    { runValidators: true }
  );

  if (result.matchedCount === 0) {
    return res.status(404).send('Calendar entry not found.');
  }
  return res.redirect(303, calendarUrl);
});

router.post('/:id/delete', async (req, res) => {
  const result = await CollectionCalendar.deleteOne({ _id: req.params.id });
  if (result.deletedCount === 0) {
    return res.status(404).send('Calendar entry not found.');
  }
  return res.redirect(303, calendarUrl);
});

router.use((error, req, res, next) => {
  if (error.code === 11000) {
    return res.status(409).send('That service already has a collection on this date.');
  }
  return next(error);
});

module.exports = router;