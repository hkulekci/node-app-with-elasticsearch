var express = require('express');
var router = express.Router();
var waterfall = require('async/waterfall');
var categoryService = require('../services/categoryService');
var categorySearchService = require('../services/categorySearchService');

/* GET categories listing. */
router.get('/', function(req, res, next) {
  waterfall(
    [
      function(waterfallCallback) {
        categoryService.getRecords(function(err, categories) {
          if(err) { res.send(500,"Server Error"); return; }
          var results = {
            'categories': categories
          };
          waterfallCallback(false, results);
        });
      },
      function(results, waterfallCallback) {
        categorySearchService.getRecords(function(err, esCategories) {
          results.esCategories = esCategories;
          waterfallCallback(false, results);
        });
        
      }
    ],
    function(err, results) {
      if (err) {}
      res.render('categories', {'title': 'Categories', categories: results.categories, esCategories: results.esCategories });
    }
  );
});

module.exports = router;
