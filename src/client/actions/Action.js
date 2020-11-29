'use strict';
const APIRequest = require('../../rest/APIRequest');
const GETDASH_UPDATE = 'dummy value';

const query_getUser = {
  expand: [
    'default_starting_point',
    'phone_number_components'
  ],
  extra: [
    'applicant_unique_link',
    'can_receive_red_card_deliveries',
    'country_shortname',
    'date_of_birth',
    'default_starting_point.encoded_polyline',
    'drive_quality_tier',
    'has_urgent_issue',
    'insurance_expiration',
    'is_activated_for_drive_orders',
    'is_background_checked',
    'is_deactivated',
    'is_eligible_for_drive_orders',
    'is_employee',
    'is_equipped_for_large_orders',
    'is_first_delivery_complete',
    'is_on_latest_tos_version',
    'is_selected_for_drive_orders',
    'license_expiration',
    'market_id',
    'needs_supplemental_onboarding_user_experience',
    'payment_account',
    'phone_number_components',
    'purchase_card',
    'should_show_referral_visibility',
    'show_available_balance',
    'stripe_managed_account_required',
    'submarket',
    'timezone',
  ]
};
const query_getDash = {
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
};

class Action {
  constructor() {
    // Shortcut:
    this.APIRequest = APIRequest;

    // private, use get<name>() getters
    this.user     = null;
    this.vehicles = null;
    this.dash     = null;

    this.area     = null;
  }

  /**
   * handle: format the data from the fetch getter
   * @returns <Promise>

  **/
  handle(data) {
    return data;
  }

  get fetch() {
    return new Error('Missing Fetch');
  }

  /**
   * Standard functions
   */

  get getUser() {
    if (!(this.user)) this.updateUser();

    return this.user.then((user) => {
      let result = {
        name: String(`${user.first_name} ${user.last_name}`),
        email: String(user.email),
        phone: String(user.phone_number_components.national_number),
        country: String(user.country_shortname),
        birthday: new Date(user.date_of_birth),

        id: Number(user.id),
        starting_point: user.default_starting_point,

        istopdasher: Boolean(user.drive_quality_tier !== 'low'),
        isdeactivated: Boolean(user.is_deactivated),
        isredcard: Boolean(user.can_receive_red_card_deliveries),
        isondrive: Boolean(user.is_activated_for_drive_orders),
        iseligibledrive: Boolean(
          user.is_selected_for_drive_orders || user.is_eligible_for_drive_orders
        ),
      };
      return result;
    });
  }

  get getVehicle() {
    if (!(this.vehicle)) this.updateVehicle();

    return this.vehicles.then((vehicles) => {
      const CAR = 1;

      let vehicleCar = vehicles.find(element => element.vehicle_type_id = CAR);
      if (vehicleCar) return vehicleCar;
      // else
      // XXX: bug(?) user doesn't have a car?
      return vehicles[vehicles.length - 1];
    })
  }

  get getDash() {
    if (!(this.dash)) this.updateDash();

    return this.dash.then((dash) => {
      let result = {};
      let nextDash = dash[dash.length - 1];

      if (!(nextDash)) return { id: -1, live: false, };
      // else
      const fnGen = (id, action, extra = undefined) => {
        return () => {
          const qs = require('querystring');
          let extra;

          // stupid, but works (TM)
          if (action === 'check_in') {
            const location = require('../../util/location');
            extra = location().then(gps => {
              return {
                lat: `${gps.lat}`,
                lng: `${gps.lng}`,
                expand: 'starting_point',
              };
            });
          }

          return Promise.resolve(extra).then((data) => {
            return new APIRequest(
              'post',
              `/v1/dashes/${id}/${action}/?${qs.stringify(query_getDash)}`,
              data || {}
            )
            .catch((e) => {
              return console.error(`Failed to ${action}, ${e}`);
            })
            .finally(() => {
              if (this) this.updateDash();
            });
          });
        }
      } // fnGen for resume, pause.

      Object.defineProperties(nextDash, {
        live: {
          value: !!(nextDash.check_in_time),
          enumerable: true,
        },

        paused: {
          value: !(nextDash.auto_assign),
          enumerable: true,
        },

        /* pausefn, resumefn:
         * Stop/start dash just by calling the getter.
         * TODO: return { non_field_errors } on error; Update this.dash automatically.
         */

        pausefn: {
          value: fnGen(nextDash.id, 'pause'),
          enumerable: true,
          configurable: true,
        },

        resumefn: {
          value: fnGen(nextDash.id, 'resume'),
          enumerable: true,
          configurable: true,
        },

        startfn: {
          value: fnGen(nextDash.id, 'check_in'),
          enumerable: true,
          configurable: true,
        },

        stopfn: {
          value: fnGen(nextDash.id, 'check_out'),
          enumerable: true,
          configurable: true,
        }
      });

      return nextDash;
    });
  }

  get getArea() {
    if (!(this.area)) this.updateArea();

    return this.area.then((number) => {
      if (number <= 0) {
        // return all data if possible.
        return false;
      }

      return Number(number);
    });
  }

  updateUser() {
    this.user = new APIRequest('get', '/v1/dashers/me/', query_getUser);

    return this.user;
  }

  updateVehicle() {
    this.vehicles = new APIRequest('get', '/v3/dasher/me/vehicles/');

    return this.vehicles;
  }

  updateDash() {
    this.dash = new APIRequest('get', '/v1/dashers/me/dashes/', query_getDash,
      { cache: !(this.dash) }
    );

    return this.dash;
  }

  updateArea(area = undefined) {
    if (typeof area === 'number' || area === false) {
      this.area = Promise.resolve(Number(area));
    } else {
      this.area = Promise.all([this.getDash, this.getUser]).then((result) => {
        const dash = result[0];
        const user = result[1];
        let area;

        area = !!(dash)
        ? dash.starting_point.id
        : user.starting_point.id

        return area;
      });
    }

    return this.area;
  }
}

module.exports = Action;
