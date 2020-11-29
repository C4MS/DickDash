'use strict';
const Action = require("./Action");
const Location = require('../../util/location');
const turf = require('@turf/turf');

class Areas extends Action {
  constructor() {
    super();
  }

  handle(data) {
    // Resolve starting point, default if needed.
    return this.getArea.then((area) => {
      return Promise.resolve(data).then((input) => {
        let result = [];
        let array = !!(area)
        ? input.filter(e => e.id == area)
        : input;

        const point = (object = { lat: 0, lng: 0 }) => {
          return turf.point([
              object.lat,
              object.lng,
            ]);
        };

        const pointArray = (input = [{ lat: 0, lng: 0 }]) => {
          let result = [];

          input.forEach((element, index) => {
            result[index] = point(element.location);
          });

          return result;
        };

        array.forEach((element, index) => {
          let status = element.vehicle_dash_status[0];
          // TODO(?): Find user's vehicle (car, bike); and report that instead [0].

          result[index] = {
            name: element.name.replace(/^[A-Z]+: /, ''),
            id: Number(element.id),
            date: Date.now(),

            busyness: String(status.busyness_status),

            boost: {
              active: element.active_boost || {},
              upcoming: element.upcoming_boosts,
            },

            location: {
              isfar: element.is_outside_dasher_current_market,
              coords: point(element.location),
              polyline: element.encoded_polyline,
              hotspots: pointArray(element.hotspots),
            },
          }
        });

        // if (area == 'all') ->
        if (result.length === 1) return result[0];
        // else
        return result;
      });
    });
  }

  get fetch() {
    return this.getVehicle.then((vehicle) => {
      return Location().then((location) => {
        return new this.APIRequest(
          'get',
          '/v2/starting_points/',
          {
            dasher: 'me',
            lat: location.lat,
            lng: location.lng,
            vehicle_type: vehicle.vehicle_type.id,
          }
        );
      });
    });
  }
}

module.exports = Areas;
