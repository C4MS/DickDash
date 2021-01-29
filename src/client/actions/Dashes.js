'use strict';
const Action = require("./Action");
const Order = require("./Orders");

class Dashes extends Action {
  constructor() {
    super();
  }

  handle(data) {
    return Promise.resolve(data).then((data) => {
      let result = {
        shift: [],
        additional: [],
        compat: [],
      };

      data.shifts.forEach((element) => {
        if (element.total_pay === 0) return /* continue */;
        // else
        // Object.defineProperties(element, {
        //   deliveriesfn: {
        //     value: () => {
        //       return Order.handle(Order.fetchHistory(element.id))
        //     },
        //     configurable: true,
        //     enumerable: true,
        //   }
        // });

        result.shift.push(element);
      });

      data.jobs.forEach((element) => {
        result.additional.push(element);
      });

      result.compat = data.weekly_trend_data.monthly_data_points;

      return result;
    });
  }

  get fetch() {
    return new this.APIRequest(
      'get',
      '/v1/dashers/me/earnings_weekly'
    )
  }
}

module.exports = Dashes;
