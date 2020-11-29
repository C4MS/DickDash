'use strict';
const Action = require("./Action");

class Annoucements extends Action {
  constructor() {
    super();
  }

  handle(data) {
    return data.then((array) => {
      let result = [];
      array.forEach((element, index) => {
        result[index] = {
          title: element.title,
          body: String(element.body).replace(/(\\n|\\r)+/, '\n'),
          image: element.image_url,
          expires: (new Date(element.expiration_date))
        }
      });
      return result;
    });
  }

  get fetch() {
    return this.getUser.then((user) => {
      return new this.APIRequest('get', '/v2/dasher_announcements/', {
        dasher: user.id
      });
    });
  }
}

module.exports = Annoucements;
