const GeoJSON = require('mongoose-geojson-schema')
const mongoose = require('mongoose');
const Promise = require('bluebird');

const { Schema } = mongoose;
const { Point, ObjectId } = Schema.Types;

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGO_URI, { promiseLibrary: Promise });

const pointSchema = new Schema({
  _id: ObjectId,
  aidName: String,
  type: String,
  lnmSource: String,
  summary: String,
  loc: Point,
});

const PointModel = mongoose.model('Point', pointSchema);

const insertPoints = (points = []) => PointModel.insertMany(points);

module.exports.insertPoints = insertPoints;
