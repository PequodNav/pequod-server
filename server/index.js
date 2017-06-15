/** Module dependencies. */
require('dotenv').config();
const express = require('express');
const path = require('path');
const { insertPoints } = require('./db');
const parseCoastGuard = require('../parsers/coastGuard');

const port = process.env.PORT || 3000;

// configure the express app and server
const app = express();
app.set('port', port);
app.use(express.static(path.resolve(__dirname, '../public/')));

/** Start her up, boys */
app.listen(app.get('port'), () => {
  console.log(`Express server listening on port ${app.get('port')}`);
});

// fetch all the coast guard points, and insert them into our database
parseCoastGuard()
  .then(points => insertPoints(points));
