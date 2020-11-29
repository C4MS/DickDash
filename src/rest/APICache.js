 'use strict';
const { setupCache } = require('axios-cache-adapter');
const CACHE_KEY = Symbol.for("APIRequest.cache");

let globalSymbols = Object.getOwnPropertySymbols(global);
let hasCache = (globalSymbols.indexOf(CACHE_KEY) > -1);

if (!(hasCache)) {
  global[CACHE_KEY] = setupCache({
    maxAge: 10 * 60 /**/ * 1000,
    debug: !!(process.env.DEBUG),
    exclude: {
  	   query: false,
    },
  });
}

module.exports = global[CACHE_KEY];
