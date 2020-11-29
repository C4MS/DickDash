'use strict';
const ActionManager = require('./actions/ActionManager');

class Client {
  constructor(options = {}) {
    this.Actions = new ActionManager();
  }
}

module.exports = Client;
