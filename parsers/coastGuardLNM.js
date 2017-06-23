/**
 * Parses coast guard (LNM) data
 * Downloads XML from https://www.navcen.uscg.gov/?Do=lnmXmlDownload and extracts:
 *   - DISCREPANCY_UNIQUE_IDENTIFIER or TEMPCHANGE_UNIQUE_IDENTIFIER
 *   - AID_NAME
 *   - TYPE
 *   - ASSIGNED_LATITUDE
 *   - ASSIGNED_LONGITUDE
 *   - SUMMARY
 *   - LIGHT_LIST_NUMBER
 */
const request = require('request-promise');
const Promise = require('bluebird');
const parseString = Promise.promisify(require('xml2js').parseString);
const parseCoordinates = require('./parseCoordinates');

const LNMURL = 'https://www.navcen.uscg.gov/?Do=lnmXmlDownload';

/**
 * Here's the meat of the parsing. After converting from XML to JSON we've got
 * crazy looking objects. The goal is to extract the properties we care about
 * into a nice clean flat object.
 */
const parseArray = (array, pointType) => array.map(point => {
  const {
    [`${pointType}_UNIQUE_IDENTIFIER`]: [_id],
    STATUS: [{ SUMMARY: [summary] }],
    AID: [{ AID_NAME: [aidName], TYPE: [type], ASSIGNED_LATITUDE: [latitude] = [], ASSIGNED_LONGITUDE: [longitude] = [], LIGHT_LIST_NUMBER: [lightListNumber] = []}]
  } = point;
  if (latitude && longitude) {
    return {
      _id,
      aidName,
      type,
      lightListNumber: lightListNumber && parseFloat(lightListNumber),
      source: pointType,
      summary,
      loc: parseCoordinates(latitude, longitude),
    };
  }
}).filter(parsedPoint => !!parsedPoint);

/**
 * Have our default export function be a method that returns a promise resolving
 * with the array of discrepancies and tempChanges as parsed by the above parsers.
 * So, in order, we fetch the XML, convert it to JSON, extract the bits we care
 * about, and resolve into one uber array.
 */
const parseCoastGuard = () => {
  console.log(`fetching lnm data from ${LNMURL}`);
  return request(LNMURL)
    .then(xml => {
      console.log('received xml for lnm, parsing into json');
      return parseString(xml)
    })
    .then(json => {
      console.log('converted xml to json, parsing into points');
      const { LNM: { DISCREPANCIES: [{ DISCREPANCY }], TEMPORARY_CHANGES: [{ TEMPORARY_CHANGE }] } } = json;
      const discrepancies = parseArray(DISCREPANCY, 'DISCREPANCY');
      const tempChanges = parseArray(TEMPORARY_CHANGE, 'TEMPCHANGE');
      const points = [...discrepancies, ...tempChanges].filter(point => !!point.loc);
      console.log(`${points.length} lnm points parsed`);
      return points;
    })
    .catch(err => console.error('parsing failed', err));
}

module.exports = parseCoastGuard;
