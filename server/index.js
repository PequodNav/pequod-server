/** Module dependencies. */
require('dotenv').config();
const express = require('express');
const path = require('path');
const Promise = require('bluebird');
const { insertPoints, deletePoints, searchNear, searchWithin } = require('./db');
const parseCoastGuardLNM = require('../parsers/coastGuardLNM');
const parseCoastGuardWeekly = require('../parsers/coastGuardWeekly');

const port = process.env.PORT || 3000;

// configure the express app and server
const app = express();
app.set('port', port);
app.use(express.static(path.resolve(__dirname, '../public/')));

/** endopoint for querying points within a distance around a lat lng */
app.get('/points/near', ({ query: { lat, lng, distance, limit } }, res) => {
  searchNear(parseFloat(lat), parseFloat(lng), distance && parseFloat(distance), limit && parseInt(limit))
    .then(points => res.json(points))
    .catch(e => res.status(500).json(e));
});

/** endpoint for querying points within a coordinate set */
app.get('/points/within', ({ query: { coordinates } }, res) => {
  try {
    searchWithin(JSON.parse(coordinates))
      .then(points => res.json(points))
      .catch(e => res.status(500).json(e));
  } catch(e) {
    res.status(400).send('bad coordinates');
  }
});

/** Start her up, boys */
app.listen(app.get('port'), () => {
  console.log(`Express server listening on port ${app.get('port')}`);
});

// fetch all the coast guard points, and insert them into our database after
// removing what's already there (def a better way to do this using smart
// updates based on ids and whatnot)
const updatePoints = () =>
  deletePoints()
    .then(() => Promise.join(
      parseCoastGuardLNM(),
      parseCoastGuardWeekly(),
      (lnmPoints, weeklyPoints) => {
        const pointsToAdd = [...lnmPoints, ...weeklyPoints];
        console.log(`inserting ${pointsToAdd.length} points`);
        return insertPoints(pointsToAdd);
      }
    ))
    .then(() => console.log('we did it!'))
    .catch(e => console.error('we didnt do it!', e));

// update the points now, and fetch new ones every 24 hours
// updatePoints();
// setInterval(() => updatePoints(), 24 * 60 * 60 * 1000);
