'use strict';
const Action = require("./Action");

const VARIABLES = [
  'DASHER_STARTING_POINT_CACHE_PERIOD',
  'DRIVE_BEACONS_AUTOSWIPE_WHITELIST',
  'DASHING_TIPS',
  'PREASSIGN_MAX_HOURS_IN_ADVANCE',
  'DASHER_UNASSIGN_REASONS_LOCALIZED',
  'DASHER_SUPPORT_PHONE',
  'DASHER_SUPPORT_TEXT',
  'DASHER_SELF_UNASSIGN_PENALTY',
  'DASHER_SELF_UNASSIGN_TIMELIMIT',
  'DASHER_ACCEPT_TIMEOUT',
  'DASHER_ATO_PREVENTION_THRESHOLD_IN_HOURS',
  'EARLY_ASSIGN_REMINDER_TIME_IN_MINUTES',
  'DASHER_ACTIVITY_CONFIGURATION',
  'DRIVE_PREASSIGN_REVEAL_TIME_24H',
  'DRIVE_TIER_CUTOFF_SCORE',
  'DRIVE_PREASSIGN_REVEAL_BUFFER_IN_HOURS',
  'DRIVE_PREASSIGN_REVEAL_OVERRIDE_DASHER_IDS',
  'DRIVE_PREASSIGN_REVEAL_SUBMARKETS',
  'DRIVE_TIER_CUTOFF_DELIVERY_COUNT',
  'DRIVE_INAPP_TIPPING_SUBMARKET_IDS',
  'DRIVE_INAPP_TIPPING_OVERRIDE_DASHER_IDS',
  'DASHER_POLLING_INTERVAL_IOS',
  'DRIVE_TARGET_DROPOFF_WINDOW_START_DELTA_IN_MINUTES',
  'DRIVE_MAX_WAIT_TIME_EARLY_SWIPE_MINUTES',
  'DRIVE_EARLY_SWIPE_PREVENTION_SUBMARKET_IDS',
  'DRIVE_EARLY_SWIPE_PREVENTION_DASHER_IDS',
  'INSTANT_PAY_DELAY_ON_CC_CHANGE_IN_DAYS',
  'DASHER_PAY_BREAKDOWN_HELP_URL',
  'DASHER_PAY_BREAKDOWN_NO_TIPPING_HELP_URL',
  'DASHER_PAY_V1_BREAKDOWN_HELP_URL',
  'DASHER_PAY_V1_BREAKDOWN_NO_TIPPING_HELP_URL',
  'DASHER_WEBVIEW_WHITELIST_URL_HOSTS',
  'IOS_DX_DROP_OFF_PHOTO_COMPRESSION_QUALITY',
  'DASHER_STARTING_POINT_CACHE_PERIOD'
]

class Defaults extends Action {
  constructor() {
    super();

    this.cache = null;
  }

  find(key) {
    if (typeof key !== 'string') throw new Error('Bad Argument');

    return this.cached.then((data) => {
      let result = data.find(element => element.key === key);
      if (result) return result.value;
      // else
      return Error('Fail to find key');
    });
  }

  handle(data) {
    return Promise.resolve(data);
  }

  get fetch() {
    if (this.cached) return this.cached;

    let promiseArray = [];
    VARIABLES.forEach((element) => {
      promiseArray.push(
        (new this.APIRequest('get', `/v1/globalvars/variables/${element}`))
        .then((data) => {
          return {
            key: element,
            value: data
          }
        })
      );
    });

    let result = this.cache = Promise.all(promiseArray);
    return result;
  }
}

module.exports = Defaults;
