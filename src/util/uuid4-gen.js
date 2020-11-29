'use strict';
const SUFFIX = '-dx-ios';

/* uuidv4:
 * https://stackoverflow.com/a/2117523
 * Meant for generating X-Request-ID's, nothing *too* serious
 */
function uuidv4() {
 return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
   var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
   return v.toString(16);
 });
}

const uuidGenerator = () => {
  return `${String(uuidv4()).toUpperCase()}${SUFFIX}`;
}

module.exports = uuidGenerator;
