'use strict';
const Action = require("./Action");

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

const dateTimeline = (end = Date(), days = 5) => {
  const date = new Date(end);

  let result = {};
  result.end    = dateFormatter(date);
  date.setDate(date.getDate() - days);
  result.start  = dateFormatter(date);

  return result;
}

class Dasher extends Action {
  constructor() {
    super();

    this.backtrack = 5; /* days */
  }

  handle(data) {
    return Promise.resolve(data).then((drive) => {
      const DECIMAL = 100;
      let result = [];

      drive.forEach((element, index) => {
        result[index] = {
          id: element.id,
          area: element.starting_point,
          deliveries: element.num_deliveries,

          date: new Date(element.scheduled_start_time),
          ended: new Date(element.check_out_time),

          pay: {
            tip: (element.tip_amount / DECIMAL),
            base: (element.delivery_pay / DECIMAL),
            amount: (element.total_pay / DECIMAL),
            status: element.payment_status,
          },
        }
      });

      return result;
    });
  }

  get fetch() {
    return this.getUser.then((user) => {
      const time = dateTimeline(Date(), this.backtrack);

      return new this.APIRequest('get', `/v1/dashers/${user.id}/dashes/`,
          {
            completed: 1,
            end_time: time.end,
            extra: [
              'has_extreme_lateness_issues',
              'is_on_dynamic_pay_model',
              'num_sos_deliveries',
              'payment_status',
              'sos_pay',
              'total_pay'
            ],
            pay_fields: 1,
            start_time: time.start,
        }
      );
    });
  }

  set history(number) {
    this.backtrack = number;
  }

  static date(input) {
    return dateFormatter(input);
  }
}


// XXX: Remove when 'new' keyword problem is dealt with
module.exports.date = dateFormatter;
module.exports = Dasher;
