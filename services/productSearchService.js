var db = require('./../libraries/elasticsearch');

exports.getRecords = function(params, callback) {
  body = {
    query: {
    },
    size: 50
  };

  if (params.category) {
    body.query.term = {
      "categories.id": {
        "value": params.category
      }
    };
  }

  if (params.keyword) {
    body.query.query_string = {
      "fields": ["name^4", "description^2", "categories.name^3"],
      "query": params.keyword
    };
  }

  db.search({
    index: 'products',
    type: 'product',
    body: body
  }).then(function (resp) {
    var hits = resp.hits;
    callback(false, hits);
    return;
  }, function (err) {
    callback(true);
    console.trace(err.message);
    return;
  });
};