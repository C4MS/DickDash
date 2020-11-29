const writer = require('../util/storewriter');

module.exports = (client, argument) => {
  return client.Actions.Orders.get.then((data) => {
    let result = [];

    data.forEach((order) => {
      const toLocaleTime = (date) => {
        date = new Date(date);
        if (isNaN(date)) return "Unknown";

        let hours = date.getHours();
        let minutes = date.getMinutes();
        let part = hours >= 12 ? 'PM' : 'AM';
        hours = (hours % 12) || 12;
        minutes = String(minutes).length === 1
          ? `0${minutes}`
          : minutes

        return `${hours}:${minutes} ${part}`;
      }

      let array;
      let string;
      let items;

      if (!(argument)) writer(order);

      items = order.item.data.map(e => `${e.name}`);
      if (items.length === 0) items = ["(Unknown)"]

      array = [
        (order.is.merchant ? "MR" : "DD"),
        (order.is.asap ? "✅" : "❌"),
        "⏰ " + toLocaleTime(order.time.dasher.pickup),
        `🍔 ${order.item.count} 🥛${order.item.drinks}`,
        `🚫 ${order.declines}`
      ];
      header = `Order (${array.join(' | ')})`;

      array = [
        `(${order.store.name}) ${order.pay.string}`,
        '',
        `Customer: ${order.customer.name}`,
        `Subtotal: ${order.customer.subtotal.string}`,
        `Pickup from: "${order.location.store.text}"`,
        `Deliver to: "${order.location.customer.text}"`,
        '',
        `Instructions: "${String(order.customer.instructions.text || '(none)').replace("'", "\\'")}"`,
        '',
        `Store Confirmed: ${toLocaleTime(order.time.store.confirmed)}`,
        `Store Est. Pickup: ${toLocaleTime(order.time.store.pickup)}`,
        `Ready: ${order.store.should_notify ? "Yes" : "Never is"}.`,
        '',
        `Customer Est. Dropoff: ${toLocaleTime(order.time.customer.dropoff)}`,
        `Dasher Late at: ${toLocaleTime(order.time.dasher.late)}`,
        '',
        `Stack? ${order.is.stack ? "Yes" : "No"}.`,
        `Timer: ${order.accept.timer}`,
        '',
        `Customer Maps: ${order.location.customer.url}`,
        '',
        'Items:',
        `\t${items.join('\n\t')}`
      ]
      footer = array.join('\n');

      result.push([header, footer]);
    });

    return result;
  });
}
