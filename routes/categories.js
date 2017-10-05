var express = require('express');
var router = express.Router();
var categoryService = require('../services/categoryService');

/* GET categories listing. */
router.get('/', function(req, res, next) {
  categoryService.getRecords(function(err, results) {
    if(err) { res.send(500,"Server Error"); return; }
    // Respond with results as JSON
    res.render('categories', {'title': 'Categories', categories: results });
  });
});

module.exports = router;
