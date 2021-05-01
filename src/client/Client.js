'use strict';
const ActionManager = require('./actions/ActionManager');
const EventsCreator = require('./events/Events');

class Client {
  constructor(options = {}) {
    this.Actions = new ActionManager();
    this.Events = EventsCreator;
  }
}

module.exports = Client;
