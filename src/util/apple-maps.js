'use strict';
const querystring = require('querystring');

/** directionsURL:
 *  Returns a apple maps URL that works across devices.
 * @param {Object} end - GEOJSON Point
 * @param {Object} [start] - GeoJSON Point
 */
function directionsURL(end, start = {}) {
  const MAPURL = 'https://maps.apple.com/?'
  const MAPTYPE = 'm';
  const MAPZOOM = 10;

  const directionType = (object) => {
    let type;
    if ((object) && (object.type)) {
      type = object.type;
    }

    switch (type) {
      case 'standard':
        return 'm';
      case 'satellite':
        return 'k';
      case 'hybrid':
        return 'h';
      default:
        return MAPTYPE;
    }
  }

  let startingPoint = {};
  let endingPoint = {};

  if ((Object.keys(start).length > 0) && !(Array.isArray(start))) {
    [ startingPoint.lat, startingPoint.lng ] = start.geometry.coordinates;
    startingPoint.coords = String(`${startingPoint.lat},${startingPoint.lng}`);
  } else {
    startingPoint = undefined;
  }

  if ((Object.keys(end).length > 0) && !(Array.isArray(end))) {
    endingPoint.name = !! end.properties
      ? end.properties.name
      : "Unknown Point";
    endingPoint.type = directionType(end.properties);
    [ endingPoint.lat, endingPoint.lng ] = end.geometry.coordinates;
    endingPoint.coords = String(`${endingPoint.lat},${endingPoint.lng}`);
  } else {
    return new Error('Missing require information to create URL!');
  }

  let result = {
    q: String(endingPoint.name),
    t: endingPoint.type,
    z: MAPZOOM,
  };

  if (startingPoint) {
    result.saddr = endingPoint.coords;
    result.daddr = startingPoint.coords;
  } else {
    result.ll = endingPoint.coords;
  }

  return String(MAPURL + querystring.stringify(result));
}

module.exports = directionsURL;
