'use strict';
const crypto = require('crypto');

const createHash = (hash, prefix = "", time = Date.now()) => {
  const output = crypto
    .createHash(String(hash))
    .update(String(time + Math.random() + prefix))
    .digest('hex');

  if (prefix) return `${prefix}_${output}`;
  // else
  return output
}

const gen = {
  __cfuid: `${createHash('md5')}`,
  dd_session_id_2: `${createHash('sha1', 'sx')}`,
  dd_session_id: `${createHash('sha1', 'sx')}`,
  dd_device_id: `${createHash('sha1', 'dx')}`,
  dd_login_id: `${createHash('sha1', 'lx')}`,
  dd_device_id_2: `${createHash('sha1', 'dx')}`,
  doordash_attempt_canary: 0,
  __cf_bm: `${createHash('md5')}`,
}

module.exports = Object.keys(gen)
  .map((key) => {
    return `${key}=${gen[key]}`;
  })
  .join("; ")
