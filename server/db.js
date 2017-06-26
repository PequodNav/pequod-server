const GeoJSON = require('mongoose-geojson-schema')
const mongoose = require('mongoose');
const Promise = require('bluebird');

const { Schema } = mongoose;
const { Point, ObjectId } = Schema.Types;

const DEFAULT_DISTANCE = 5; // 5 miles
const DEFAULT_LIMIT = 100;  // 100 points

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGO_URI, { promiseLibrary: Promise });

/** Our point schema. */
const pointSchema = new Schema({
  // all points have these
  _id: ObjectId,
  aidName: String,
  loc: Point,
  lightListNumber: Number,
  type: String,
  source: String,

  // only coast guard lnm points have these
  summary: String,

  // only weekly points have these
  characteristic: String,
  height: Number,
  range: String,
  remarks: String,
  structure: String,
});

// initialize our index and model
pointSchema.path('loc').index('2dsphere');
const PointModel = mongoose.model('Point', pointSchema);

/**
 * Given an array of points, insert them into the database
 */
const insertPoints = (points = []) => PointModel.insertMany(points);

/**
 * Remove all points from the database
 */
const deletePoints = () => PointModel.remove({});

/**
 * Get all points
 */
const getPoints = () => PointModel.find({});

/**
 * Given a lat, lng, and optionally distance, and limit, perform a geospatialSearch
 * and return all relevant points.
 */
const searchNear = (lat, lng, distance = DEFAULT_DISTANCE, limit = DEFAULT_LIMIT) => {
  // approximately 3959 miles in the earth's radius
  const distanceInRadians = distance / 3959;
  return PointModel.find({
    loc: {
      $nearSphere: [lng, lat],
      $maxDistance: distanceInRadians,
    }
  }, null, { limit });
}

/**
 * Return points within a given coordinate system.
 * Note: see mongo docs for what to do if polygon spans multiple hemispheres
 */
const searchWithin = coordinates =>
  PointModel.find({
    loc: {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates,
        }
      }
    }
  });

module.exports.insertPoints = insertPoints;
module.exports.deletePoints = deletePoints;
module.exports.getPoints = getPoints;
module.exports.searchNear = searchNear;
module.exports.searchWithin = searchWithin;
