var express = require('express');
var router = express.Router();
var productService = require('../services/productService');

/* GET products listing. */
router.get('/', function(req, res, next) {
  var queryParams = req.query
  productService.getRecords(queryParams, function(err, results) {
    if(err) { res.send(500,"Server Error"); return; }
    // Respond with results as JSON
    res.render('products', {'title': 'Products', products: results, 'totalCount': results.length});
  });
});

/* GET products listing. */
router.get('/:id', function(req, res, next) {
  var params = req.params;
  productService.getRecord(params.id, function(err, product) {
    if(err) { res.send(500,"Server Error"); return; }
    // Respond with results as JSON
    if (product === undefined) {
      res.send(400,"Not Found");
      return;
    }
    res.render('product', {'title': product['name'], product: product });
    return;
  });
});

module.exports = router;
