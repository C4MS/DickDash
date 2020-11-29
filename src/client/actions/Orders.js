'use strict';
const Action = require("./Action");
const turf = require("@turf/turf")
const applemaps = require("../../util/apple-maps");

const query_orders = {
  dasher: 'me',
  expand: [
    'orders',
    'orders.order_items.item',
    'orders.order_items.options.item_extra_option',
    'orders.order_items.options',
    'orders.order_items.options.item_extra_option.item_extra',
    'orders.order_items.item.category',
    'orders.order_items',
    'store.business',
    'order_cart',
    'drive_store_catering_setup_instruction',
    'store'
  ],
  extra: [
    'dasher_special_instructions',
    'requires_payment_card',
    'dasher_assigned_time',
    'orders.order_items',
    'order_cart.order_special_instructions',
    'pickup_address.address.shortname',
    'pickup_address.subpremise',
    'requires_dropoff_confirmation',
    'accept_modal_badge',
    'dasher_preferred_by_store_bonus_cents',
    'drive_order_type',
    'orders.order_items.options',
    'orders.consumer',
    'delivery_address.address.city',
    'store.should_notify_dasher_for_pickup',
    'pickup_instructions',
    'is_preassign',
    'delivery_address.address.id',
    'store.business',
    'order_cart.min_age_requirement',
    'customer_unavailable_escalated_at',
    'order_placer_claimed_time',
    'is_ready_for_pickup',
    'dasher_wait_remaining_seconds',
    'dasher_accept_assignment_remaining_seconds',
    'pickup_address.address.printable_address',
    'delivery_address.parking_tips',
    'orders.order_items.options.item_extra_option',
    'actual_order_place_time',
    'delivery_address.address.is_coordinate_overriden',
    'actual_delivery_time',
    'min_pay_for_request_a_dasher_delivery',
    'chat_agent_id',
    'item_count',
    'is_route',
    'dasher_accept_assignment_max_seconds',
    'dasher_confirmed_at_consumer_time',
    'orders.order_items.item_extra_option.parent_title',
    'return_info',
    'cash_on_delivery',
    'dasher_confirmed_time',
    'barcode_scanning_required',
    'estimated_pickup_time',
    'orders',
    'orders.order_items.item.category',
    'dasher_pay_details',
    'package_details',
    'delivery_metadata',
    'pickup_address.address.city',
    'dasher_confirm_at_consumer_on_time_bonus_cents',
    'pay_details_version',
    'is_pre_tippable',
    'subtotal',
    'dasher_pickup_contacts',
    'source',
    'store',
    'is_from_store_to_us',
    'store.is_error_prone',
    'pickup_address.parking_tips',
    'store.business.cover_img_url',
    'items',
    'orders.order_items.options.item_extra_option.item_extra',
    'pay_model_type',
    'store_confirmed_time',
    'dynamic_delivery_time',
    'pickup_address.address',
    'quoted_delivery_time',
    'delivery_items',
    'order_cart',
    'is_post_tippable',
    'delivery_address.address.printable_address',
    'is_return_delivery',
    'is_returnable_delivery',
    'signature_required',
    'is_signature_relationship_required',
    'consumer',
    'setup_pay_eligible',
    'dynamic_pickup_time',
    'order_protocol',
    'pickup_address.establishment_name',
    'delivery_address.address',
    'pickup_address.address.id',
    'dasher_dropoff_contacts',
    'dasher_accept_assignment_deadline',
    'delivery_address.address.subpremise',
    'actual_pickup_time',
    'is_dasher_preferred_by_store',
    'dasher_confirmed_at_store_time',
    'delivery_notes_enabled',
    'store.did_recently_switch_from_red_card',
    'is_post_tipping_ever_eligible',
    'delivery_address.address.shortname',
    'orders.order_items.item',
    'drive_store_catering_setup_instruction.url',
    'equip_dx_for',
    'required_agreements',
    'is_contactless_delivery',
    'shadow_info'
  ]
}

const parseID = (object) => {
  return object.id || object.delivery_uuid;
}

const parseOrder = (order) => {
  const DECIMAL = 1e+2;
  const HAVERSINE = {
    units: 'miles',
    limit_medium: 4,
    limit_short: 2,

    long: 1.25,
    medium: 1.45,
    short: 1.80,

    resolve: undefined,
  };

  HAVERSINE.resolve = (result) => {
    if (result <= HAVERSINE.limit_short) {
      return HAVERSINE.short;
    } else if (result <= HAVERSINE.limit_medium) {
      return HAVERSINE.medium;
    } else {
      return HAVERSINE.long;
    }
  }

  /* ###### HELPERS ###### */
  const createPoint = (array, prop = {}) => {
    return turf.point(array, prop);
  }

  const getPay = (input) => {
    const pay = String(input / DECIMAL);

    let decimal = pay.split('.')[1];
    let length = decimal && decimal.length > 2
      ? decimal.length
      : 2;

    return Number(pay).toFixed(length);
  }

  const getDeclines = (order) => {
    const decline = 0.25;
    const regular = 3.00;
    const stack   = 2.00;
    const basePay = (order.dasher_pay_details.base_pay / DECIMAL);

    let modifier = (basePay >= regular)
      ? regular
      : stack;
    let result = ((basePay - modifier) / decline);

    if ((result % 1) === 0) return result;
    // else: we've got a wrong answer
    return Number(-1);
  }

  const getCustomer = (order) => {
    const { first_name, last_name } = order.consumer;
    let result = String(`${first_name} ${last_name}`);

    // Resolve last name if possible:
    try {
      order.items.forEach((element) => {
        let key = element.bundle_key;
        if ((key) && (key.split(' ')[0] === first_name)) {
          result = String(key);

          throw BreakException;
        }
      })
    } catch(e) { /* do nothing */ };

    return result;
  }

  const getDrinks = (order) => {
    const wordlist = [ // FIXME: should be a config option.
      "Orange Juice",
      "Coca-Cola",
      "Dr Pepper",
      "Coke",
      "Sprite",
      "Root Beer",
      "Fanta",
      "Tea",
      "Water",
      "Lemonade",
      "Brew",
      "Milk",
      "Fruit Punch",
      "Apple Juice",
      "Orange Juice",
      "Beverage",
      "Oreo",
      "Drink Choice"
    ];
    const regex = new RegExp(wordlist.join('|'), 'i');

    let count = 0;
    order.items.forEach((element) => {
      let string = `${element.name} ${element.description}`;
      let amount = (element.quanity || 1);

      if (regex.test(string)) count += amount;
    });

    return count;
  }

  const getInstruct = (order) => {
    const instruct = order.delivery_address.dasher_instructions;
    const gateregex = /((\d{4})(?:#)?)/;

    let result = { text: "", gate: "" };

    try {
      result.text = instruct;
      result.gate = instruct.match(gateregex)[0];
    } catch { /* do nothing */ };

    return result;
  }


  const getAddress = (address, name = undefined) => {
    const point = getAddressPoint(address, name);

    return applemaps(point);
  }

  const getAddressPoint = (address, name = undefined) => {
    name = name || address.printable_address;
    // Input should be 'address' object (XXX: provide example order data).
    let properties = { name: name };
    let [lat, lng] = [address.lat, address.lng];

    return createPoint([lat, lng], properties);
  }

  const getAddressCustomer = (order) => {
    // wrapper
    return getAddress(order.delivery_address.address);
  }

  const getAddressStore = (order) => {
    // wrapper
    return getAddress(order.store.address, order.store.name);
  }

  const getAddressDeliver = (order, distance = false) => {
    let start = getAddressPoint(order.store.address);
    start.properties.type = 'satellite';
    let end = getAddressPoint(order.delivery_address.address);

    if (distance) {
      const result = turf.distance(start, end, { units: HAVERSINE.units });
      const modifier = HAVERSINE.resolve(result);

      return {
        start: start,
        end: end,

        guess: (Math.round(result * DECIMAL * modifier) / DECIMAL),
        haversine: result,
      };
    } else {
      return applemaps(start, end);
    }
  }
  /* ##### */

  if (!(order) || (Object.keys(order).length === 0)) {
    return new Error('Empty order object');
  }

  let result = {
    id: parseID(order),
    declines: getDeclines(order),

    item: {
      data: order.items,
      count: order.item_count,
      drinks: getDrinks(order),
    },

    store: {
      source: order.source,
      name: order.store.name,

      error_prone: order.store.is_error_prone,
      should_notify: order.store.should_notify_dasher_for_pickup,
    },

    customer: {
      name: getCustomer(order),
      instructions: getInstruct(order),
      subtotal: {
        actual: (order.subtotal / DECIMAL),
        string: '$' + getPay(order.subtotal),
      },
    },

    location: {
      store: {
        text: String(order.store.address.printable_address),
        url: getAddressStore(order),
      },

      customer: {
        text: String(order.dropoff_location_info.printable_address),
        url: getAddressCustomer(order),
      },

      deliver: {
        url: getAddressDeliver(order),
        distance: getAddressDeliver(order, true),
      },
    },

    accept: {
      timer: (order.dasher_accept_assignment_remaining_seconds || -1),
      accepted: (!! order.dasher_confirmed_time),
    },

    time: {
      store: {
        placed: order.actual_order_place_time,
        confirmed: order.store_confirmed_time,
        pickup: order.estimated_pickup_time,
      },

      dasher: {
        assigned: order.dasher_assigned_time,
        confirmed: order.dasher_confirmed_time,
        store: order.dasher_confirmed_at_store_time,
        pickup: order.dynamic_pickup_time,
        dropoff: order.dynamic_delivery_time,
        late: order.delivery_metadata.latest_delivery_time,
      },

      customer: {
        dropoff: order.quoted_delivery_time,
      },
    },

    pay: {
      actual: (order.dasher_pay_details.actual_pay / DECIMAL),
      offered: (order.dasher_pay_details.offered_pay / DECIMAL),
      tip: (order.dasher_pay_details.tip_amount / DECIMAL),
      base: (order.dasher_pay_details.base_pay / DECIMAL),
      peak: ((order.dasher_pay_details.peak_pay || 0) / DECIMAL),
      additional: (order.dasher_pay_details.dd_additional_pay / DECIMAL),

      string: '$' + getPay(order.dasher_pay_details.actual_pay),
    },

    is: {
      // example: foo.is.merchant
      gift: order.gift_metadata
        ? order.gift_metadata.is_gift
        : false,
      asap: order.is_asap,
      merchant: order.is_from_store_to_us,
      preassign: order.is_preassign,
      redcard: order.is_from_store_to_us,
      alcohol: order.barcode_scanning_required,
      signable: order.signature_required,
      returnable: order.is_returnable_delivery,
      route: order.is_route,
      contactless: order.is_contactless_delivery,
      stack: (order.dasher_accept_assignment_max_seconds >= 50),
      merchant_stack: (order.package_details.delivery_count > 1),
      // XXX: Find the meaning of ^^^, not sure if `order` object tracks dasher's 'packages'?
    }
  }

  if (process.env.NODE_ENV === 'debug')
    result.__data = order;

  return result;
}

class Orders extends Action {
  constructor() {
    super();
  }

  /* Helper functions:
   * accept, unassign, metadata
   * order is optional, passing it allows for error checking.
   * Should be a parsed order object from Order.handle()
   */

  accept(id, order = null) {
    if (!(id) && (order)) {
      id = order.id;
    }

    if (order) {
      // Do (optional) error checking.
      if (order.accept.accepted) return new Error('Order is already accepted!');
      // TODO: More checks...
    }

    if (!(id)) return new Error(`id is ${id} (false value).`);
    if (process.env.DEBUG_ORDER) return Promise.resolve(`debug accept ${id}`);
    // else
    return new this.APIRequest(
      'post',
      `/v3/deliveries/${id}/confirm_dasher/?extra=dasher_confirmed_time`,
    );
  }

  unassign(id, order = null, ) {
    if (!(id) && (order)) {
      id = order.id;
    }

    if (order) {
      // Do (optional) error checking.
      if (order.accept.accepted) {
        console.warn('WARN: Order is already accepted!');
      }
      // TODO: More checks...
    }

    if (!(id)) return new Error(`id is ${id} (false value).`);
    if (process.env.DEBUG_ORDER) return Promise.resolve(`debug unassign ${id}`);
    // else
    return new this.APIRequest(
      'post',
      `/v2/deliveries/${id}/unassign/?extra=id&extra=package_details`,
      {
        reason: 'other',
        is_early_assignment: (!!(drive)),
      },
    );
  }

  metadata(id) {
    // metadata 'confirms' to server that we're still active
    return false; // XXX: this requires a 'shift_id'?
    // /v4/deliveries/{id}/dasher_events/
  }

  handle(data) {
    return Promise.resolve(data).then((orders) => {
      let result = [];
      let array = [];

      // Allow for input to be of a array. (parse multiple orders).
      if (Array.isArray(orders)) {
        array = orders;
      } else {
        array.push(orders);
      }

      array.forEach((order, index) => {
        result[index] = parseOrder(order);


        // wrappers to accept, unassign
        const fnGen = (fn, order) => {
          return () => {
            return fn(null, order);
          }
        }

        Object.defineProperties(result[index], {
          acceptfn: {
            value: fnGen(this.accept, result[index]),
            enumerable: true,
            configurable: true,
          },

          declinefn: {
            value: fnGen(this.unassign, result[index]),
            enumerable: true,
            configurable: true,
          },
        });
      });

      return result;
    });
  }

  get fetch() {
    if (process.env.DEBUG_ORDER) {
      const fs = require('fs');
      const fsPromises = fs.promises;
      let array = process.env.DEBUG_ORDER.split(',');
      let result = [];

      array.forEach((file) => {
        result.push(
          fsPromises.readFile(file, 'utf8').then((data, err) => {
            data = JSON.parse(data);
            if (data.__data) return data.__data;
            return Promise.resolve(data);
          })
        );
      });

      return Promise.all(result);
    }

    return this.fetchOrder;
  }

  get fetchActive() {
    return this.getDash.then((dash) => {
      if (!(dash.live)) {
        console.error(new Error(`Trying to view non-live dash`));
        return [];
      }

      return new this.APIRequest(
        'get',
        `/v3/dashes/${dash.id}/active_deliveries/`,
        null,
        { cache: false },
      );
    });
  }

  get fetchOrder() {
  // array: [{ id: <number>, delivery_uuid: <uuid> }, ...]
    return this.fetchActive.then((array) => {
      let promises = [];

      array.forEach((element) => {
        let id = parseID(element);
        promises.push(
          new this.APIRequest(
            'get',
            `/v5/deliveries/${id}/`,
            query_orders,
            { cache: false },
          )
        );
      });

      return Promise.all(promises);
    });
  }
}

module.exports = Orders;
