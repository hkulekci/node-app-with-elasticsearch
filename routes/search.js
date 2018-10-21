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
    res.render('search', results);
  });

  return;
});

router.get('/suggest', function(req, res, next) {
  var queryParams = req.query
  var terms = queryParams.keyword.trim().split(' ');
  var keyword = terms.pop();

  productSearchService.getSuggestions(keyword, function(err, results) {
    if(err) { res.send(500, "Server Error"); return; }
    var data = {'suggestions':[]};
    for (p in results.options) {
      var tempTerms = terms.slice(0);
      tempTerms.push(results.options[p].text);
      var searchText = tempTerms.join(' ');

      data.suggestions.push({
        'search-text': searchText,
        'suggest': results.options[p].text
      });
    }

    res.render('suggestions', data);
  });

  return;
});

module.exports = router;
