module.exports = (client, argument) => {
  argument = Number(argument || 0);
  if (argument) {
    client.Actions.Areas.updateArea(argument);
    client.Actions.Hotspots.updateArea(argument);
  }

  client.Actions.Areas.getArea.then(x => console.log(argument, x));

  return client.Actions.Areas.get.then((areas) => {
    return client.Actions.Hotspots.get.then((hotspots) => {
      let result = [];
      let args;

      hotspots.forEach((location) => {
        let element = [
          `At: ${location.name}`,
          `Order: ${location.orders}`,
          `Index: ${Number(location.index).toFixed(2)}`,
          `GPS: ${location.point.geometry.coordinates}`,
          '', // \n
        ];

        result.push(element.join('\n'));
      });

      result.push(`${areas.name} is ${areas.busyness.replace('_', ' ')}.`);

      return result.join('\n');
    });
  });
}
