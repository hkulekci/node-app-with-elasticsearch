var express = require('express');
var router = express.Router();
var productService = require('../services/productService');
var productSearchService = require('../services/productSearchService');
var parallel = require('async/parallel');

/* WITH DATABASE QUERY */
/* GET product searching. */
router.get('/', function(req, res, next) {
  var queryParams = req.query

  parallel({
    db: function(callback) {
        
      productService.getRecords(queryParams, function(err, results) {
        if(err) { res.send(500, "Server Error"); return; }
        callback(null, {'products': results, 'totalCount': results.length});
      });

    },
    elastic: function(callback) {
      
      productSearchService.getRecords(queryParams, function(err, results) {
        if(err) { res.send(500, "Server Error"); return; }
        var products = [];
        for (p in results.hits) {
          products.push(results.hits[p]._source);
        }
        callback(null, {'products': products, 'totalCount': results.total});
      });

    }
  }, function(err, results) {
    console.log(results);
    res.render('search', results);
  });

  return;
});

module.exports = router;
