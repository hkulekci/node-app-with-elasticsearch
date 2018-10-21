var db = require('./../libraries/elasticsearch');

exports.getSuggestions = function(keyword, callback) {
  body = {
    "suggest": {
      "suggest": {
        "completion": {
          "field": "completion",
          "size": 10,
          "skip_duplicates": true
        },
        "text": keyword
      }
    }
  };

  db.search({
    index: 'products',
    type: 'product',
    body: body
  }).then(function (resp) {
    var hits = resp.suggest.suggest[0];
    callback(false, hits);
    return;
  }, function (err) {
    callback(true);
    console.trace(err.message);
    return;
  });
}

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
    body.query.bool = {
      "must": []
    };

    var terms = params.keyword.split(' ');
    for (var i = 0; i < terms.length; i++) {
      if (!terms[i]) {
        // ignore empty term
        continue;
      }
      body.query.bool.must.push({
        "bool": {
          "should": [
            {
              "fuzzy" : {
                "name.autocomplete" : {
                  "value": terms[i],
                  "boost": 10.0,
                  "fuzziness": 1,
                  "prefix_length": 0,
                  "max_expansions": 100
                }
              }
            },
            {
              "fuzzy" : {
                "description.autocomplete" : {
                  "value": terms[i],
                  "boost": 2.0,
                  "fuzziness": 1,
                  "prefix_length": 0,
                  "max_expansions": 100
                }
              }
            },
            {
              "fuzzy" : {
                "category.name.autocomplete" : {
                  "value": terms[i],
                  "boost": 3.0,
                  "fuzziness": 1,
                  "prefix_length": 0,
                  "max_expansions": 100
                }
              }
            }
          ]
        }
      });
    } // end of for
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