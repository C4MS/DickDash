module.exports = (client, argument) => {
  argument = Number(argument || 0);
  if (argument) {
    client.Actions.Areas.updateArea(argument);
    client.Actions.Hotspots.updateArea(argument);
  }

  client.Actions.Areas.getArea.then(x => console.log(argument, x));

  return client.Actions.Areas.get.then((area) => {
    client.Actions.Hotspots.cupcake = area;
    return client.Actions.Hotspots.get.then((hotspots) => {
      let result = [];
      let args;

      hotspots.forEach((location) => {
        let element = [
          `At: ${location.name}`,
          `Order: ${location.orders}`,
          `GPS: ${location.point.geometry.coordinates}`,
          '', // \n
        ];

        result.push(element.join('\n'));
      });

      result.push(`${area.name} is ${area.busyness.replace('_', ' ')}.`);

      return result.join('\n');
    });
  });
}
