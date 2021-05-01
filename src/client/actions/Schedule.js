'use strict';
const Action = require("./Action");
const Areas = require('./Areas');
const querystring = require('querystring');

const query_schedule = '?' + querystring.stringify({
  expand: [
    'vehicle.vehicle_type',
    'starting_point',
    'vehicle'
  ],
  extra: [
  'vehicle',
  'num_preassigned_deliveries',
  'allowed_ma_seconds',
  'remaining_ma_seconds',
  'auto_assign',
  'can_extend_until',
  'current_manual_assign_interval',
  'is_on_dynamic_pay_model',
  'starting_point',
  'starting_point.submarket'
  ]
});

/* TODO: Match date to current time:
 * if:
 *  (time -> 12:PM (midnight) <-> 5:AM) && (input is today's date)
 * then:
 *  Switch hours to what the app uses during those times.
 *
 * why:
 *  Current assumes 6:AM to 10:AM next day, skipping midnight.
 */
const dateNearest = (date = Date()) => {
  const DAY = 1;
  let start = new Date(date);
  let end;

  start.setHours(0,0,0,0);
  end = new Date(start.setDate(start.getDate() + DAY));
  end.setHours(23,55,13,37);

  // prevent casting
  start = start.toISOString();
  end = end.toISOString();

  return {
    start: start,
    end: end,
  }
}

const dateFormatter = (input = Date()) => {
  // format: YYY-DD-MM + T + ss + GMT
  const format = (date) => {
    const iso     = date.toISOString();
    const string  = date.toString();

    return (
      iso.replace(/\..+/, '')
      + string.match(/-[0-9]*/g)[0].replace(/00/, ':00')
    );
  }

  if ((typeof input === 'string') && (input.match(/-[0-9]+:[0-9]+$/))) {
    // TODO: better test
    // already formatted.
    // console.error("Already formatted");
    return input;
  }

  return format(new Date(input));
}

class Schedule extends Action {
  constructor() {
    super();

    this.areasCached = null;
    this.baseQueryCached = null;
    this.impromptu_dash = 1;
  }

  get Areas() {
    this.updateArea(0);
    this.areasCached = this.areasCached || (new Areas()).fetch

    return this.areasCached;
  }

  baseQuery(input, self = this) {
    return Promise.all([self.getUser, self.getVehicle]).then((array) => {
      const user = array[0];
      const vehicle = array[1];

      let result = {
        dasher: String(user.id),
        vehicle_type: String(vehicle.vehicle_type_id),
        is_impromptu_dash: Boolean(this.impromptu_dash || 0),
      }

      return Object.assign(result, input);
    });
  }

  setSchedule(id, start, end, self = this) {
    if (
      (typeof id !== 'number' && id > 0)
      || isNaN(new Date(start))
      || isNaN(new Date(end))
    ) {
      return new Error('Invalid Input - Check Data.');
    }

    // TODO: Better way to wrap this for schedulefn.
    // self == this
    return self.baseQuery({
      starting_point: String(id),
      scheduled_start_time: dateFormatter(start),
      scheduled_end_time: dateFormatter(end),
    }).then((query_set) => {
      // console.error(">>>", query_set);
      return (new self.APIRequest('post', `/v1/dashes/${query_schedule}`, query_set, { uuid: true }))
        .then((data) => {
          if (data.non_field_errors) return new Error(`${data.non_field_errors}`);
          // else
          return data;
        });
    }).finally(() => {
      if (this) this.updateDash();
    });
  }

  // input; id, start time, end time;
  removeSchedule(id, start, end, self = this) {
    const input = id || start || end;

    if (this !== self) self.updateDash(); // FIXME: self ~= this issue.
    return self.getDash.then(() => {
      return self.dash; // TODO: way to get raw data
    }).then((dashes) => {
      if (!(input)) return new Error('Missing arguments');

      let dash = dashes.find(element =>
        Boolean(
          element.id === Number(input)
          || element.scheduled_start_time === String(input)
          || element.scheduled_end_time   === String(input)
        )
      );

      return dash;
    }).then((dash) => {
      if (!(dash)) return new Error('Failed to find dash.');
      // else
      return (new self.APIRequest('delete', `/v1/dashes/${dash.id}/`, { uuid: true }))
        .then((data) => {
          if (data.non_field_errors) return new Error(`${data.non_field_errors}`);
          // else
          return data;
        });
    }).finally(() => {
      if (this) this.updateDash();
    });
  }

  changeSchedule(id, start, end) {
    if (
      (typeof id !== 'number' && id > 0)
      || isNaN(new Date(start))
      || isNaN(new Date(end))
    ) {
      return new Error('Invalid Input - Check Data.');
    }

    const query_change = {
      scheduled_start_time: dateFormatter(start),
      scheduled_end_time: dateFormatter(end),
    };

    return new this.APIRequest('patch', `/v1/dashes/${id}/`, query_change);
  }

  getSchedule(date = Date()) {
    date = new Date(date);
    if (isNaN(date)) return new Error('Invalid date object');

    return this.Areas.then((area) => {
      let list = [];

      area.forEach(x => list.push(x.id));

      return list;
    }).then((list) => {
      const dateObject = dateNearest(date);

      return this.baseQuery({
        dasher: 'me',
        start_time: dateObject.start,
        end_time: dateObject.end,
        starting_points: list,
      });
    }).then((query_get) => {
      return new this.APIRequest('get', '/v1/dasher_time_slots/', query_get, { cache: false });
    });
  }

  handle(data) {
    return this.Areas.then((area) => {
      let map = {};

      area.forEach(x => map[x.id] = x.name);

      return map;
    }).then((map) => {
      return Promise.resolve(data).then((schedule) => {
        const fnGen = (fn, id, start, end, self = this) => {
          return () => {
            return fn(id, start, end, self);
          }
        }

        let result = {};
        schedule = schedule.flat(); // fetch returns array of proimses.

        schedule.forEach((element) => {
          const id = Number(element.starting_point);

          result[id] || (
            result[id] = {
              name: `${map[id] || "?"}`,
              slots: [],
            }
          );

          result[id].slots.push({
            start: element.start_time,
            end: element.end_time,
            string: {
              start: (new Date(element.start_time)).toLocaleString(),
              end: (new Date(element.end_time)).toLocaleString(),
            },

            schedulefn: fnGen(this.setSchedule, id, element.start_time, element.end_time, this),
            deletefn: fnGen(this.removeSchedule, null, element.start_time, element.end_time, this),
          });
        });

        return result;
      }).then((result) => {
        return this.getArea.then((id) => {
          if (id) return result[id];
          // else
          return result;
        });
      }); /* return Proimse.resolve */
    });
  }

  get fetch() {
    const WEEK = 8; // TODO: check if lastest day schedule is posted.
    const DAY = 1;
    let promises = [];
    let date = new Date();
    date.setDate(date.getDate() - DAY); // Today

    for (let i = 0; i < WEEK; i++) {
      let result = this.getSchedule(date);
      promises.push(result);
      date.setDate(date.getDate() + DAY);
    }

    return Promise.all(promises);
  }
}

module.exports = Schedule;
