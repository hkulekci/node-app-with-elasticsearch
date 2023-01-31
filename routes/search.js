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
        callback(null, {'products': products, 'totalCount': results.total.value});
      });

    }
  }, function(err, results) {
    res.render('search', results);
  });

  return;
});

router.get('/suggest', function(req, res, next) {
  let queryParams = req.query
  let terms = queryParams.keyword.trim().split(' ');
  let keyword = terms.pop();

  productSearchService.getSuggestions(keyword, function(err, results) {
    if (err) { res.send(500, "Server Error"); return; }
    let data = {'suggestions':[]};
    for (p in results.options) {
      let tempTerms = terms.slice(0);
      tempTerms.push(results.options[p].text);
      let searchText = tempTerms.join(' ');

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
