var express = require('express');
var router = express.Router();
var productService = require('../services/productService');
var categoryService = require('../services/categoryService');
var waterfall = require('async/waterfall');
var productSearchService = require('../services/productSearchService');

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
router.get('/id/:id', function(req, res, next) {
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

router.get('/new', function(req, res, next) {
  var product = {
    'id': 0,
    'name': '',
    'description': '',
    'price': '',
    'quantity': ''
  };
  categoryService.getRecords(function(err, results) {
    res.render('product-form', {'product': product, 'url': '/product/new', categories: results});
  });
});

router.post('/new', function(req, res, next) {
  var params = req.body;
  var categories = params.categories;
  delete params['categories'];

  //TODO: Form filter&validation opearation required!

  waterfall(
    [
      function(waterfallCallback) {
        result = {};
        productService.insert(params, function(err, insertId) {
          if (err) { res.redirect('/product'); }
          productService.upsertCategories(insertId, categories, function(err) {
            result.insertId = insertId;
            waterfallCallback(false, result);
          })
        });
      },
      function(result, waterfallCallback) {
        categoryService.getProductCategories(result.insertId, function(err, productCategories) {
          if (err) {}
          result.productCategories = productCategories;
          waterfallCallback(false, result);
        });
      },
      function(result, waterfallCallback) {
        productService.getRecord(result.insertId, function(err, product) {
          if (err) {}
          result.product = product;
          waterfallCallback(false, result);
        });
      },
      function(result, waterfallCallback) {
        var product = result.product;
        product.categories = result.productCategories;

        productSearchService.insert(product, function() {
          waterfallCallback(false, product);
        });
      }
    ],
    function(err, product) {
      if (err) {}
      res.redirect('/product/id/'+product.id);
    }
  );
});

router.get('/:id/edit', function(req, res, next) {
  var params = req.params;

  waterfall(
    [
      function(waterfallCallback) {
        productService.getRecord(params.id, function(err, product) {
          if (err) {
            waterfallCallback(err);
            return;
          }
          waterfallCallback(false, {'product': product});
        });
      },
      function(result, waterfallCallback) {
        categoryService.getRecords(function(err, categories) {
          result.categories = categories;
          waterfallCallback(false, result);
        });
      },
      function(result, waterfallCallback) {
        categoryService.getProductCategories(params.id, function(err, productCategories) {
          result.productCategories = productCategories;
          waterfallCallback(false, result);
        });
      },
      function(result, waterfallCallback) {
        for (i in result.categories) {
          for (j in result.productCategories) {
            if (result.categories[i].id == result.productCategories[j].id) {
              result.categories[i].selected = true;
              break;
            } else {
              result.categories[i].selected = false;
            }
          }
        }
        waterfallCallback(false, result);
      }
    ],
    function(err, results) {
      if (err) {
        res.send(400,"Not Found");
        return;
      }
      res.render('product-form', {
        'product': results.product, 
        'categories': results.categories, 
        'productCategories': results.productCategories, 
        'url': '/product/'+params.id+'/edit'
      });
    }
  );
});


router.post('/:id/edit', function(req, res, next) {
  var params = req.body;
  var queryParams = req.params;
  params.id = queryParams.id;
  var categories = params.categories;
  delete params['categories'];

  //TODO: Form filter&validation opearation required!

  waterfall(
    [
      function(waterfallCallback) {
        productService.update(params, function(err, changedRows) {
          if (err) { res.redirect('/product'); }
          productService.upsertCategories(queryParams.id, categories, function(err) {
            waterfallCallback(false);
            return;
          })
        });      
      },
      function(waterfallCallback) {
        var result = {};
        categoryService.getProductCategories(params.id, function(err, productCategories) {
          if (err) {}
          result.productCategories = productCategories;
          waterfallCallback(false, result);
        });
      },
      function(result, waterfallCallback) {
        productService.getRecord(params.id, function(err, product) {
          if (err) {}
          result.product = product;
          waterfallCallback(false, result);
        });
      },
      function(result, waterfallCallback) {
        var product = result.product;
        product.categories = result.productCategories;

        productSearchService.insert(product, function() {
          waterfallCallback(false, product);
        });
      }
    ],
    function(err, product) {
      if (err) {}
      res.redirect('/product/id/' + product.id);
      return;
    }
    );
  
});

module.exports = router;
