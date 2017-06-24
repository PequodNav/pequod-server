require('dotenv').config();
const fs = require('fs');
const Promise = require('bluebird');
const json2csv = Promise.promisify(require('json-2-csv').json2csv);
const { getPoints } = require('../server/db');

/**
 * Fetch all points from mongo, convert them to csv and write to points.csv
 */
console.log('fetching points from mongo');
getPoints().then((points) => {
  console.log(`found ${points.length} points`);
  return json2csv(points.map(point => Object.assign({
    _id: '',
    aidName: '',
    loc: { type: '', coordinates: [] },
    lightListNumber: '',
    type: '',
    source: '',
    summary: '',
    characteristic: '',
    height: '',
    range: '',
    remarks: '',
    structure: '',
  }, point._doc)));
}).then((csv) => {
  fs.writeFileSync('points.csv', csv);
  console.log('wrote to points.csv');
  process.exit();
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
