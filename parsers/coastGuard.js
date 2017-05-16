/**
 * Parses coast guard (LNM) data
 * Downloads XML from https://www.navcen.uscg.gov/?Do=lnmXmlDownload and extracts:
 *   - DISCREPANCY_UNIQUE_IDENTIFIER or TEMPCHANGE_UNIQUE_IDENTIFIER
 *   - AID_NAME
 *   - TYPE
 *   - ASSIGNED_LATITUDE
 *   - ASSIGNED_LONGITUDE
 *   - SUMMARY
 */

const request = require('request-promise');
const Promise = require('bluebird');
const parseString = Promise.promisify(require('xml2js').parseString);
const dms2dec = require('dms2dec')

const LNMURL = 'https://www.navcen.uscg.gov/?Do=lnmXmlDownload';

request(LNMURL)
  .then(xml => parseString(xml))
  .then(json => {
    const { LNM: { DISCREPANCIES: [{ DISCREPANCY }], TEMPORARY_CHANGES: [{ TEMPORARY_CHANGE }] } } = json;
    const discrepancies = parseArray(DISCREPANCY, 'DISCREPANCY');
    const tempChanges = parseArray(TEMPORARY_CHANGE, 'TEMPCHANGE');
    const points = [...discrepancies, ...tempChanges];

    console.log(JSON.stringify(points, null, 2));
    console.log(`${points.length} points parsed`);
  })
  .catch(err => console.error('parsing failed', err))

/**
 * Here's the meat of the parsing. After converting from XML to JSON we've got
 * crazy looking objects. The goal is to extract the properties we care about
 * into a nice clean flat object.
 */
const parseArray = (array, pointType) => array.map(point => {
  const {
    [`${pointType}_UNIQUE_IDENTIFIER`]: [id],
    STATUS: [{ SUMMARY: [summary] }],
    AID: [{ AID_NAME: [aidName], TYPE: [type], ASSIGNED_LATITUDE: [latitude] = [], ASSIGNED_LONGITUDE: [longitude] = [] }]
  } = point;
  if (latitude && longitude) {
    return {
      id,
      aidName,
      type,
      lnmSource: pointType,
      summary,
      loc: parseCoordinates(latitude, longitude),
    };
  }
}).filter(parsedPoint => !!parsedPoint);

/**
 * Latitude and longitude are of the format '41-15-22.980N' or '072-39-50.640W'
 * Return a GeoJSON formatted object
 */
const parseCoordinates = (latitude, longitude) => {
  const latReference = latitude[latitude.length - 1];
  const longReference = longitude[longitude.length - 1];
  const latDMS = latitude.substring(0, latitude.length - 1).split('-').map(string => parseFloat(string));
  const longDMS = longitude.substring(0, longitude.length - 1).split('-').map(string => parseFloat(string));
  return {
    type: 'Point',
    // GeoJSON stores coordinates in reversed order (longitude, latitude) so we reverse
    coordinates: dms2dec(latDMS, latReference, longDMS, longReference).reverse(),
  };
}
