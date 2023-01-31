const db = require('./../libraries/elasticsearch');

exports.getProductCountByDate = function(params, callback) {
  const body = {
    "size": 0, 
    "aggs": {
      "product_counts": {
        "date_histogram": {
          "field": "created_at",
          "calendar_interval": "week"
        }
      }
    }
  };

  db.search({
    index: 'products',
    body: body
  }).then(function (resp) {
    console.log(resp)
    let aggs = resp.aggregations.product_counts.buckets;
    let result = {
      "keys": [],
      "vals": []
    };
    for (const i in aggs) {
      result['keys'].push(aggs[i].key_as_string);
      result['vals'].push(aggs[i].doc_count);
    }
    callback(false, result);
    return;
  }, function (err) {
    callback(true);
    console.trace(err.message);
    return;
  });
};

exports.getCategoriyQuantitySum = function(params, callback) {
  body = {
    "size": 0, 
    "aggs": {
      "product_categories": {
        "terms": {
          "field": "categories.id",
          "size": 10
        },
        "aggs": {
          "sum": {
            "sum": {
              "field": "quantity"
            }
          }
        }
      }
    }
  };

  db.search({
    index: 'products',
    type: 'product',
    body: body
  }).then(function (resp) {
    var aggs = resp.aggregations.product_categories.buckets;
    var result = {
      "keys": [],
      "vals": [],
      "counts": []
    };
    for (i in aggs) {
      result['keys'].push(aggs[i].key);
      result['counts'].push(aggs[i].doc_count);
      result['vals'].push(aggs[i].sum.value);
    }
    callback(false, result);
    return;
  }, function (err) {
    callback(true);
    console.trace(err.message);
    return;
  });
};


exports.getProductQuantities = function(params, callback) {
  body = {
    "size": 0, 
    "aggs": {
      "product_counts": {
        "date_histogram": {
          "field": "created_at",
          "interval": "week"
        },
        "aggs": {
          "product_quantities": {
            "sum": {
              "field": "quantity"
            }
          }
        }
      }
    }
  };

  db.search({
    index: 'products',
    type: 'product',
    body: body
  }).then(function (resp) {
    var aggs = resp.aggregations.product_counts.buckets;
    var result = {
      "keys": [],
      "vals": [],
      "counts": []
    };
    for (i in aggs) {
      result['keys'].push(aggs[i].key_as_string);
      result['counts'].push(aggs[i].doc_count);
      result['vals'].push(aggs[i].product_quantities.value);
    }
    callback(false, result);
    return;
  }, function (err) {
    callback(true);
    console.trace(err.message);
    return;
  });
};