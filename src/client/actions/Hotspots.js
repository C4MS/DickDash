'use strict';
const Action = require("./Action");
const turf = require('@turf/turf');

class Hotspots extends Action {
  constructor() {
    super();

    this.cupcake = 0;     // experiment: Hotspot has timestamp information.
    this.hotzone = false; // experiment: Hotspot has a polyline around hotspots (like postmates). - cupcake required.
  }

  set zone(number) {
    this.cupcake = number;
  }

  handle(data) {
    return this.getArea.then((area) => {
      return Promise.resolve(data).then((array) => {
        let result = [];
        let hotspot = (typeof area === 'number')
          ? array.filter(e => e.starting_point == area)
          : array;

        // experiments:
        if ((this.cupcake) && (hotspot.length <= 0)) {
          hotspot = array; // XXX: Rewrite logic, getArea used here but not in fetch.
        }

        if (this.hotzone === true) {
          return data;
        }
        // ----

        hotspot.forEach((element, index) => {
          let updated = {
            name: String(element.name).replace(/^Near /, ''),
            orders: Number(element.num_orders) || undefined,
            index: (Math.round(element.heat_index * 1e+4) / 1e+2),
            date: Date.now(),
            refresh: Date.parse(element.next_refresh_timestamp) || null,
            point: turf.point([
                element.location.lat,
                element.location.lng,
              ], {
                name: element.name,
                amount: Number(element.num_orders),
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
        if (typeof this.cupcake === 'number' && this.cupcake > 0) {
          request['starting_point_id'] =
            this.cupcake
            || (dash.starting_point && dash.starting_point.id)
            || (user.starting_point && user.starting_point.id);
          // TODO(?) resolve location.
          request['lng'] = 0;
          request['lat'] = 0;

          if (this.hotzone === true) {
            // new v3 hotspot - requires cupcake
            // * No order amounts used anymore (con)
            // * But cool new polyline is shown around merchants (pro?)
            return new this.APIRequest('get', '/v3/dasher/hotspots', request, { cache: false });
          }
        }

        return new this.APIRequest('get', '/v1/dasher_hotspots/', request, { cache: false });
      });
    });
  }
}

module.exports = Hotspots;
