'use strict';
const turf = require('@turf/turf');
const fs = require('fs');

module.exports = fs.promises.readFile(`${__dirname}/map-box-data-2`, 'utf8').then((data) => {
  data = global.data = JSON.parse(data)[0];
  return data;
});
