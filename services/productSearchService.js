var db = require('./../libraries/elasticsearch');

exports.getRecords = function(params, callback) {
  body = {
    query: {},
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
      "fields": ["name.autocomplete^10", "description.autocomplete^2", "categories.name.autocomplete^3"],
      "query": params.keyword,
      "default_operator": "AND"
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

exports.insert = function(product, callback) {
  db.index({
    index: 'products',
    type: 'product',
    id: product.id,
    body: product
  }, function (error, response) {
    if (error) { callback(true, error); return; }
    callback(false, response);
  });
};


exports.delete = function(productId, callback) {
  db.delete({
    index: 'products',
    type: 'product',
    id: productId,
  }, function (error, response) {
    if (error) { callback(true, error); return; }
    callback(false, response);
  });
};