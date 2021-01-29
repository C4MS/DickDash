'use strict';
const https = require('https');

/* gpsDrift:
    The App's/iOS's location is accurate to 15 decimal places
    Emulate this behavior to some degree.
*/
const gpsDrift = (input) => {
  input = Number(input);
  if (
    (typeof input !== 'number')
    || (isNaN(input))
  ) return NaN;

  const floor = (1 + ("0".repeat(16)));
  const max = 0.0001
  const min = 0.0000001
  let drift = Math.floor((Math.random() * (max - min) + min) * floor) / floor;

  return ((Math.sign(input) > 0) ? input + drift : input - drift);
}

const useWebsite = () => {
  const URL = 'ifconfig.co';
  let headers = {
    'Host': URL,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
  let options = {
    host: URL,
    path: '/json',
    method: "GET",
    headers: headers
  }

  return new Promise((resolve, reject) => {
    let req = https.request(options, function(res) {
      let result = '';
      res.on('data', function(data) {
        result += data;
      });
      res.on('end', function(){
        result = JSON.parse(result);
        resolve({
          lat: gpsDrift(result.latitude),
          lng: gpsDrift(result.longitude)
        });
      });
    });

    req.end();
  });
}

const useEnvironment = () => {
  let result = {};
  result.lat  = gpsDrift(process.env.DOORDASH_LATITUDE);
  result.lng  = gpsDrift(process.env.DOORDASH_LONGITUDE);

  return Promise.resolve(result);
}

const useDummy = () => {
  console.warn("Using dummy values for location, this could be bad...");

  let result = { lat: 0, lng: 0 };
  return Promise.resolve(result);
}

// main:
const checkLocation = (object) => {
  // console.debug("checkLocation: ->", object);
  if (
       !(object.lat)
    || !(object.lng)
    || (typeof object.lat !== 'number')
    || (typeof object.lng !== 'number')
    || (isNaN(object.lat))
    || (isNaN(object.lng))
  ) return Promise.reject('Bad Value');
  // else
  return object;
}

const resolveLocation = (c = 0) => {
  return arrayfn[c]()
    .then((result) => {
      return checkLocation(result);
    })
    .catch(() => {
      c += 1;
      return resolveLocation(c);
    });
}

// TODO: write more ways to get location.
let arrayfn = [
  useEnvironment,
  useWebsite,
  useDummy, // always true
]
module.exports = resolveLocation;
