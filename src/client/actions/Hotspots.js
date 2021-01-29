'use strict';
const Action = require("./Action");
const turf = require('@turf/turf');

class Hotspots extends Action {
  constructor() {
    super();

    this.cupcake = true; // experiment: Hotspot has timestamp information.
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
            nextrefresh: Date.parse(element.next_refresh_timestamp) || null,
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
      return this.getDash.then((dash) => {
        let request = { dasher: user.id };
        if (this.cupcake && dash.live) {
          request['starting_point_id'] = dash.starting_point.id;
          // TODO(?) resolve location.
          request['lng'] = 0;
          request['lat'] = 0;
        }

        return new this.APIRequest('get', '/v1/dasher_hotspots/', request, { cache: false });
      });
    });
  }
}

module.exports = Hotspots;
