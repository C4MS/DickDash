'use strict';
const Action = require("./Action");
const turf = require('@turf/turf');

class Hotspots extends Action {
  constructor() {
    super();
  }

  handle(data) {
    return this.getArea.then((area) => {
      return Promise.resolve(data).then((array) => {
        let result = [];
        let hotspot = (typeof area === 'number')
        ? array.filter(e => e.starting_point == area)
        : array;

        hotspot.forEach((element, index) => {
          let updated = {
            name: String(element.name).replace(/^Near /, ''),
            orders: Number(element.num_orders),
            index: (Math.round(element.heat_index * 1e+4) / 1e+2),
            date: Date.now(),
            point: turf.point([
                element.location.lat,
                element.location.lng,
              ], {
                name: element.name,
              }),
          };

          result[index] = updated;
        });

        return result;
      });
    });
  }

  get fetch() {
    return this.getUser.then((user) => {
      return new this.APIRequest('get', '/v1/dasher_hotspots/', {
        dasher: user.id,
      });
    });
  }
}

module.exports = Hotspots;
