const path = require('path');
const fs = require('fs');

const STORE = fs.realpathSync(`${__dirname}/../store`);

const writer = (data, path) => {
  try {
    fs.writeFileSync(path, JSON.stringify(data));
  } catch {};
}

module.exports = (order) => {
  if (!(order)) return;
  
  writer(order, `${STORE}/${order.id}.json`);
}
