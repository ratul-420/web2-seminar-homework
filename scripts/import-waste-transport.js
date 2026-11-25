const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
  quiet: true
});

const WasteService = require('../models/WasteService');
const CollectionCalendar = require('../models/CollectionCalendar');
const ResidentRequest = require('../models/ResidentRequest');

const dataFolder = path.join(__dirname, '..', 'data', 'waste-transport');

function readRows(fileName, header) {
  const contents = fs.readFileSync(path.join(dataFolder, fileName), 'utf8');
  const [firstLine, ...lines] = contents.replace(/^\uFEFF/, '').trimEnd().split(/\r?\n/);

  if (firstLine !== header) {
    throw new Error(`Unexpected columns in ${fileName}`);
  }

  return lines.map((line, index) => {
    const cells = line.split('\t').map((value) => value.trim());
    if (cells.length !== header.split('\t').length || cells.some((value) => !value)) {
      throw new Error(`Invalid row in ${fileName} at line ${index + 2}`);
    }
    return cells;
  });
}

function readDate(value) {
  const isoDate = value.replace(/\./g, '-');
  const date = new Date(`${isoDate}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== isoDate) {
    throw new Error(`Invalid dataset date: ${value}`);
  }
  return date;
}

async function upsertRows(Model, rows, getKey) {
  await Model.init();
  await Model.bulkWrite(rows.map((row) => ({
    updateOne: {
      filter: getKey(row),
      update: { $set: row },
      upsert: true
    }
  })));

  console.log(`${Model.collection.name}: ${await Model.countDocuments()}`);
}

async function main() {
  const services = readRows('services.txt', 'id\twtype\tdescription')
    .map(([id, wtype, description]) => ({ id: Number(id), wtype, description }));

  const calendar = readRows('calendar.txt', 'sdate\tservid')
    .map(([sdate, servid]) => ({ sdate: readDate(sdate), servid: Number(servid) }));

  const requests = readRows('resdems.txt', 'demand\tservid\tquantity')
    .map(([demand, servid, quantity], index) => ({
      sourceRow: index + 1,
      demand: readDate(demand),
      servid: Number(servid),
      quantity: Number(quantity)
    }));

  await Promise.all([
    ...services.map((row) => new WasteService(row).validate()),
    ...calendar.map((row) => new CollectionCalendar(row).validate()),
    ...requests.map((row) => new ResidentRequest(row).validate())
  ]);

  const serviceIds = new Set(services.map(({ id }) => id));
  if ([...calendar, ...requests].some(({ servid }) => !serviceIds.has(servid))) {
    throw new Error('A calendar entry or request references an unknown service');
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing from .env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    console.log(`Database: ${mongoose.connection.name}`);
    await upsertRows(WasteService, services, ({ id }) => ({ id }));
    await upsertRows(CollectionCalendar, calendar, ({ sdate, servid }) => ({ sdate, servid }));
    await upsertRows(ResidentRequest, requests, ({ sourceRow }) => ({ sourceRow }));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(`Import failed (${error.name}${error.code ? `, ${error.code}` : ''}).`);
  process.exitCode = 1;
});