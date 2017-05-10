/** Module dependencies. */
const express = require('express');
const path = require('path');

const port = process.env.PORT || 3000;

// configure the express app and server
const app = express();
app.set('port', port);
app.use(express.static(path.resolve(__dirname, '../public/')));

/** Start her up, boys */
app.listen(app.get('port'), () => {
  console.log(`Express server listening on port ${app.get('port')}`);
});
