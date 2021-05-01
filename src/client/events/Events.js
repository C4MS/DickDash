const { EventEmitter } = require('events');
const UPDATE = 'update'; // string for event name
const TIMER = 'timer';

class Events extends EventEmitter {
  constructor(action, interval = (15 * 1000)) {
    super();

    this.action = action;
    this.interval = Number(interval)

    this._interval = undefined;
  }

  startInterval() {
    this._interval = setInterval(() => {
      this.emit(UPDATE, this.action.get)
    }, this.interval);
  }

  startTimer(timer = 100) {
    const timeout = setTimeout(() => {
      this.emit(TIMER, this.action.get)
    }, Number(timer))
  }

  endInterval() {
    this.removeAllListeners(UPDATE);
  }

  static Update = UPDATE;
  static Timer = TIMER;
}

module.exports = Events;
