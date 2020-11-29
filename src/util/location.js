'use strict';
const https = require('https');

/* gpsDrift:
    The App's/iOS's location is accurate to 15 decimal places
    Emulate this behavior to some degree.
*/
const gpsDrift = (input) => {
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

module.exports = useWebsite;
