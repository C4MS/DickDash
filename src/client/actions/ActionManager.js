'use strict';
const Action = require('./Action');
const Cache = require('../../rest/APICache');

class ActionManager {
  constructor() {
    this.register(require('./Annoucements'));
    this.register(require('./Areas'));
    this.register(require('./Dashes'));
    this.register(require('./Defaults'));
    this.register(require('./Fastpay'));
    this.register(require('./Hotspots'));
    this.register(require('./Orders'));
    this.register(require('./Ratings'));
    this.register(require('./Schedule'));

    // if debug(?)
    this.User = new Action();
    this.User.Cache = Cache;
  }

  register(Action) {
    let name = Action.name.replace(/Action$/, '');
    this[name] = new Action();
    Object.defineProperty(this[name], 'get', {
      get: () => {
        return this[name].handle(this[name].fetch);
      },
    });
  }
}

module.exports = ActionManager;
