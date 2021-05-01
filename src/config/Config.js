'use strict';
try {
  require('dotenv').config({ path: `${__dirname}/../../.env`});
} catch {
  // do nothing
}

/**
  * Config.js
  * Try to get config/information from multiple methods.
 **/

/* Defaults */
/* ############################## */
const URL = 'https://api-dasher.doordash.com';
// const URL = 'http://localhost'

const iOS = {
  version: '2.98.1',
  app: '4763.200915',
  detail: 'CFNetwork/1128.0.1 Darwin/19.6.0'
}

const defaults = {
  'language': "en-US",
  'version': `ios ${iOS.version} b${iOS.app}`,
  'user-agent': `DoordashDriver/${iOS.app} ${iOS.detail}`,
  'newrelic-id': "XAUEWF5SGwEJUlJSAwkD"
}
/* ############################## */

const tryConfig = () => {
  try {
    const file = `${__dirname}/../../config.json`;
    const result = require(file);

    if (result.token && result.cookie) return result;
    throw new Error('Config.json has missing fields or is missing.')
  } catch {
    return null;
  }
}

const tryEnviron = () => {
  let result = {
    'host': process.env.DOORDASH_API || URL,
    'token': process.env.DOORDASH_TOKEN,
    'cookie': process.env.DOORDASH_COOKIE || "",
    'user-agent': process.env.DOORDASH_AGENT || defaults['user-agent'],
    'newrelic-id': process.env.DOORDASH_NEWRELIC || defaults['newrelic-id'],
    'version': process.env.DOORDASH_VERSION || defaults['version'],
  }

  if (result.token) return result;
  throw new Error('Missing environment variables for advanced token');
}

// Web-token are basic tokens, doesn't allow all endpoints.
const tryWebtoken = async () => {
  let username = process.env.DOORDASH_EMAIL;
  let password = process.env.DOORDASH_PASSWORD;

  let fetch;
  try {
    fetch = require('node-fetch');
    if (!(username && password))
      throw new Error('Missing environment variables for basic token');
  } catch(e) { console.error(e); return null; }

  const base64decode = (data) => {
    let encoded = new Buffer.from(data, 'base64');
    return encoded.toString('ascii').trim();
  }

  const url = `${URL}/v2/auth/token/`;
  const body = {
    email: base64decode(username),
    password: base64decode(password)
  }

  let response = await fetch(url, {
    "headers": {
      "accept": "application/json",
      "user-agent": `${defaults['user-agent']}`,
      "accept-language": "en-US,en",
      "content-type": "application/json;charset=UTF-8",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "origin": "https://driver.doordash.com/",
      "referer": "https://driver.doordash.com/",
    },
    "compress": false, // -> XXX: A change in API causes 'Accept-Encoding' to failed with 406 HTML error; A User-Agent is also required.
    "body": JSON.stringify(body),
    "method": "POST",
    "mode": "cors"
  });

  let data = await response.json();
  try {
    if (data.detail) throw new Error(`Couldn't get login - ${data.detail}`);
  } catch { return null; }

  let result = {
    'host': URL,
    'token': data.token,
    'cookie': require('./cookie-generator'),
    'user-agent': process.env.DOORDASH_AGENT || defaults['user-agent'],
    'newrelic-id': process.env.DOORDASH_NEWRELIC || defaults['newrelic-id'],
    'version': process.env.DOORDASH_AGENT || defaults['version'],
  }

  return await result;
}

const resolveConfig = () => {
  let config;
  try {
    config = tryConfig();
  } catch (e) { /* XXX: BEBUG(e) */ }
  try {
    if (!(config))
      config = tryEnviron();
  } catch(e) { console.log(e) }
//  try {
//    if (!(config))
//      config = tryWebtoken();
//  } catch(e) { console.log(e) }

  if (config) return config;
  throw new Error('Missing Config');
};

if (!(require.main === module)) {
  module.exports = resolveConfig();
} else {
  // simple main thing.
  // FIXME: change to axios, was written before the switch.

  process.stderr.write(
  `
Usage: set these environ variables to base64 encoded strings:
  DOORDASH_EMAIL
  DOORDASH_EMAIL

...To get a useable token, else use a tool to intercept traffic and grab a token & cookie there.
(Output is sent to stdout)

### Result ###
  `
  );

  tryWebtoken().then((x) => {
    process.stdout.write(`${JSON.stringify(x, null, '\t')}`);
  });
}
