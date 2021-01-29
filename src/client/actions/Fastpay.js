'use strict';
const Action = require("./Action");

const OK = 'transfer_available';
const ERROR = {
  'transfer_not_available_due_to_balance':
    "Unable to pay-out due to balance.",
  'transfer_not_available_due_to_previous_transfer':
    "Unable to pay-out due to cooldown (try again in 24 hours).",
}
const DEFAULT_DEBUG = 500;
// WARNING: this will trigger a email, even if balance is wrong.
// TODO: More checks for fastpay'ing.

class Fastpay extends Action {
  constructor() {
    super();
  }

  fp(self = this) {
    return self.fetch.then((data) => {
      const status = data.status;
      // console.error(status);

      if (status !== OK) throw new Error(ERROR[status]);

      return {
        'amount_no_fee': data.balance || DEFAULT_DEBUG,
      };
    }).then((query_fastpay) => {
      return self.getUser.then((user) => {
        return new this.APIRequest('post', `/v1/dashers/${user.id}/instant_payouts/`, query_fastpay, { cache: false });
      });
    }).catch(e => { return e });
  }

  handle(data) {
    return Promise.resolve(data).then((status) => {
      const fnGen = (self = this) => {
        return () => {
          return self.fp();
        }
      }

      status.fastpayfn = fnGen(this);
      return status;
    });
  }

  get fetch() {
    return this.getUser.then((user) => {
      return new this.APIRequest('get', `/v1/dashers/${user.id}/instant_payouts/status/`);
    });
  }
}

module.exports = Fastpay;
