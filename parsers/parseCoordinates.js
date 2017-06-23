const dms2dec = require('dms2dec');

/**
* Latitude and longitude are of the format '41-15-22.980N' or '072-39-50.640W'
* Return a GeoJSON formatted object
*/
module.exports = (latitude, longitude) => {
  const latReference = latitude[latitude.length - 1];
  const longReference = longitude[longitude.length - 1];
  const latDMS = latitude.substring(0, latitude.length - 1).split('-').map(string => parseFloat(string));
  const longDMS = longitude.substring(0, longitude.length - 1).split('-').map(string => parseFloat(string));
  if (latDMS.every(dms => typeof dms === 'number') && longDMS.every(dms => typeof dms === 'number')) {
    return {
      type: 'Point',
      // GeoJSON stores coordinates in reversed order (longitude, latitude) so we reverse
      coordinates: dms2dec(latDMS, latReference, longDMS, longReference).reverse(),
    };
  }
  return null;
}
