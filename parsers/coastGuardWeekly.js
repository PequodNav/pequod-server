/**
 * Parses coast guard (LNM) weekly data
 * Downloads XML from weekly light lists and extracts:
 *   - AID_NAME
 *   - CHARACTERISTIC
 *   - AID_TYPE
 *   - LOCATION
 *   - LLNR
 *   - HEIGHT
 *   - RANGE
 *   - REMARKS
 *   - DISTRICT
 *   - STRUCTURE
 *   - LONGITUDE
 *   - LATITUDE
 */
const request = require('request-promise');
const Promise = require('bluebird');
const fs = require('fs');
const parseString = Promise.promisify(require('xml2js').parseString);
const parseCoordinates = require('./parseCoordinates');

const LNMURLS = [
  'https://www.navcen.uscg.gov/?Do=weeklyLLCXML&id=1',
  'https://www.navcen.uscg.gov/?Do=weeklyLLCXML&id=2',
  'https://www.navcen.uscg.gov/?Do=weeklyLLCXML&id=3',
  'https://www.navcen.uscg.gov/?Do=weeklyLLCXML&id=4',
  'https://www.navcen.uscg.gov/?Do=weeklyLLCXML&id=5',
  'https://www.navcen.uscg.gov/?Do=weeklyLLCXML&id=6',
  'https://www.navcen.uscg.gov/?Do=weeklyLLCXML&id=7',
  'https://www.navcen.uscg.gov/?Do=weeklyLLCXML&id=8',
  'https://www.navcen.uscg.gov/?Do=weeklyLLCXML&id=9',
  'https://www.navcen.uscg.gov/?Do=weeklyLLCXML&id=10'
];

const parseCoastGuardFromURL = url => {
  console.log(`fetching weekly from ${url}`);
  return request({
    url,
    timeout: 2 * 60 * 1000,
  }).then(xml => {
      console.log(`received xml from ${url}, parsing into json`);
      return parseString(xml)
    })
    .then(json => {
      const arrayKey = json.root['xsd:schema'][0]['xsd:element'][0]['xsd:complexType'][0]['xsd:sequence'][0]['xsd:element'][0].$.ref;
      const objectDescriptions = json.root['xsd:schema'][0]['xsd:element'][1]['xsd:complexType'][0]['xsd:sequence'][0]['xsd:element'];
      let aidNameKey, aidTypeKey, latitudeKey, longitudeKey;
      objectDescriptions.forEach(({ $: { name } }) => {
        if (/.*aid.*name/i.test(name)) {
          aidNameKey = name;
        } else if (/.*aid.*type/i.test(name)) {
          aidTypeKey = name;
        } else if (/latitude/i.test(name)) {
          latitudeKey = name;
        } else if (/longitude/i.test(name)) {
          longitudeKey = name;
        }
      });
      const points = json.root.dataroot[0][arrayKey].map(point => ({
        aidName: point[aidNameKey] && point[aidNameKey][0],
        characteristic: point.Characteristic && point.Characteristic[0],
        type: point[aidTypeKey] && point[aidTypeKey][0],
        location: point.Location && point.Location[0],
        lightListNumber: point.LLNR && point.LLNR[0] && parseFloat(point.LLNR[0]),
        height: point.Height && point.Height[0] && parseFloat(point.Height[0]),
        range: point.Range && point.Range[0] && parseFloat(point.Range[0]),
        source: `weekly district ${point.District && point.District[0]}`,
        structure: point.Structure && point.Structure[0],
        summary: point.Remarks && point.Remarks[0],
        loc: point[latitudeKey] && point[longitudeKey] && parseCoordinates(point[latitudeKey][0], point[longitudeKey][0]),
      })).filter(point => !!point.loc);
      console.log(`${points.length} points parsed for ${url}`);
      return points;
    })
    .catch(err => console.error('parsing failed', err));

}

/**
 * Have our default export function be a method that returns a promise resolving
 * with the array of points for all districts. So, in order, we fetch the XML,
 * convert it to JSON, extract the bits we care about, and resolve into one uber
 * array.
 */
const parseCoastGuardWeekly = () =>
  Promise.map(
    LNMURLS,
    url => parseCoastGuardFromURL(url)
  ).then(arrayOfArraysOfPoints =>
    arrayOfArraysOfPoints.reduce((a, b) => a.concat(b), [])
  );

module.exports = parseCoastGuardWeekly;
