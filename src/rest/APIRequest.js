'use strict';
const https = require('https');
const querystring = require('querystring');
const axios = require('axios');

const Cache   = require('./APICache');
const Config  = require('../config/Config.js');
const GET     = 'get';
const POST    = 'post';
const DELETE  = 'delete';
const PATCH   = 'patch';

/**
 * Main class for interacting with the Dasher API.
 */
class APIRequest {
  constructor(method, path, data = null, options = {}) {
    this.method = method;
    this.data = data;
    // options
    this.cache = options.cache ?? true;
    this.uuid = options.uuid ?? false;

    let queryString = '';
    if (data && method === GET) {
      queryString = querystring.stringify(data);
    }
    this.path = `${path}${queryString && `?${queryString}`}`;

    return this.request(this);
  }

  request(self = this) {
    const API = Config['host'];
    const url = `${self.path}`;
    const method = self.method;
    const data = method !== GET
      ? self.data
      : undefined;
    // cache
    const cache = self.cache === true;
    const uuid = self.uuid === true;
    const adapter = method === GET
      ? Cache
      : undefined;
    if ((adapter) && (cache === false))
      adapter.config['ignoreCache'] = true;

    let options = {
      baseURL: API,
      url: url,
      method: method,
      data: data,
      timeout: 30000,
      reponseType: 'json',
      headers: {
        'Accept':         'application/json',
        'Authorization':  `JWT ${Config['token']}`,
        'Cookie':         Config['cookie'],
        'User-Agent':     Config['user-agent'],
        'X-NewRelic-ID':  Config['newrelic-id'],
        'Client-Version': Config['version']
      },
    };
    if (adapter) options = Object.assign({}, options, adapter);
    if (uuid) {
      const uuid = require('../util/uuid4-gen');
      // Send 'token's or else the server rejects our request.
      options.headers['x-session-id']         = uuid();
      options.headers['x-correlation-id']     = uuid();
      options.headers['x-client-request-id']  = uuid();
    }

    // console.log(options);
    return axios(options)

    .then((response) => {
      if (process.env.DEBUG) { /* DEBUG */
        console.log(response.request)
        console.log(response.request.fromCache);
      }

      // XXX: status === OK:
      return response.data;
    })
    .catch((error) => {
      console.warn("error in APIRequest - global.debug_api = error");
      global.debug_api = error;

      try {
        let { data, status, statusText, headers, request } = error.response;
      } catch(e) {
        console.log(error);
        throw e;
      }

      throw error;
    });
  }
}

module.exports = APIRequest;
module.exports.GET     = GET;
module.exports.POST    = POST;
module.exports.DELETE  = DELETE;
module.exports.PATCH   = PATCH;
