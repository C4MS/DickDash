'use strict';
const Action = require("./Action");

const query_ratings = {
  fields: [
    'is_high_ar_incentive_eligible',
    'is_qualified_for_drive',
    'not_eligible_drive_description',
    'updated_at',
    'recent_num_assignments_accepted',
    'recent_num_deliveries_completed',
    'total_recent_deliveries',
    'recent_acceptance_rate',
    'recent_completion_rate',
    'recent_customer_rating',
    'expected_recent_completion_rate',
    'expected_recent_acceptance_rate',
    'recent_acceptance_rate_quality',
    'recent_completion_rate_quality',
    'recent_customer_rating_quality',
    'acceptance_rate_deactivation_threshold',
    'completion_rate_deactivation_threshold',
    'customer_rating_deactivation_threshold',
    'num_lifetime_deliveries',
    'drive_lifetime_deliveries',
    'drive_on_time_rate',
    'drive_on_time_rate_quality',
    'drive_on_time_rate_deactivation_threshold',
    'drive_on_time_to_consumer_rate',
    'drive_on_time_to_consumer_rate_quality',
    'ontime_rating',
    'preassign_completion_rating',
    'num_delivery_issues'
  ]
}

class Ratings extends Action {
  constructor() {
    super();
  }

  handle(data) {
    // Simple shortcuts since the data is easily parsed. - In App order
    return data.then((ratings) => {
      return {
        violations: ratings.num_delivery_issues,
        customer: ratings.recent_customer_rating,
        acceptance: ratings.recent_acceptance_rate,
        completion: ratings.recent_completion_rate,
        ontime: ratings.ontime_rating
          ? (Math.round(Number(ratings.ontime_rating.score * 100)) / 100)
          : undefined,
        lifetime: ratings.num_lifetime_deliveries,

        updated: new Date(ratings.updated_at),

        details: (
          (new this.APIRequest('get', '/v1/dashers/me/rating_detail/'))
          .then((data) => {
            // TODO(?) format when released.
            return data;
          })
        ),
      }
    });
  }

  get fetch() {
    return this.getUser.then((user) => {
      return new this.APIRequest('get', `/v1/dashers/${user.id}/rating/`, query_ratings);
    })
  }
}

module.exports = Ratings;
