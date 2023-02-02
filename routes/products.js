const express = require('express');
const router = express.Router();
const productService = require('../services/productService');
const categoryService = require('../services/categoryService');
const waterfall = require('async/waterfall');
const productSearchService = require('../services/productSearchService');
const redisClient = require('../libraries/redis-client');
const md5 = require('blueimp-md5');
const RedisQueue = require('hkulekci-simple-redis-queue');

const push_queue = new RedisQueue(redisClient.getClient());

/* GET products listing. */
router.get('/', async function(req, res, next) {
  const queryParams = req.query;

  const value = await redisClient.get(md5(queryParams));
  if (value !== null) {
    res.render('products', {'title': 'Products', products: value, 'totalCount': value.length, 'cache': true});
    return;
  }

  productService.getRecords(queryParams, function(err, results) {
    if(err) { res.status(500).send("Server Error"); return; }
    redisClient.set(md5(queryParams), results, 100);
    // Respond with results as JSON
    res.render('products', {'title': 'Products', products: results, 'totalCount': results.length,  'cache': false});
  });

  return;
});

/* GET products listing. */
router.get('/id/:id', function(req, res, next) {
  let params = req.params;
  productService.getRecord(params.id, function(err, product) {
    if(err) {
      res.status(500).send("Server Error");
      return;
    }
    // Respond with results as JSON
    if (product === undefined) {
      res.status(400).send("Not Found");
      return;
    }
    res.render('product', {'title': product['name'], product: product });
    return;
  });
});

router.get('/new', function(req, res, next) {
  const product = {
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
  const params = req.body;
  const categories = params.categories;
  delete params['categories'];

  //TODO: Form filter&validation opearation required!

  waterfall(
    [
      function(waterfallCallback) { // Saving Product to MySQL DB
        let result = {};
        productService.insert(params, function(err, insertId) {
          if (err) { res.redirect('/product'); }
          productService.upsertCategories(insertId, categories, function(err) {
            result.insertId = insertId;
            waterfallCallback(false, result);
          })
        });
      },
      function(result, waterfallCallback) {
        push_queue.push('product_updates', {'action':'insert', 'productId': result.insertId}, (err, result) => {
          waterfallCallback(false, result);
        });
      }
    ],
    function(err, result) {
      if (err) {}
      res.redirect('/product/id/'+result.insertId);
    }
  );
});

router.get('/:id/delete', function(req, res, next) {
  var params = req.params;

  waterfall(
    [
      function(waterfallCallback) {
        productService.delete(params.id, function(err, result) {
          //TODO: check error status
          waterfallCallback(false);
        });
      },
      function(waterfallCallback) {
        push_queue.push('product_updates', {'action':'delete', 'productId': params.id}, (err, result) => {
          waterfallCallback(false, result);
        });
      }
    ],
    function(err, result) {
      res.redirect('/product');
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
        for (let i in result.categories) {
          for (let j in result.productCategories) {
            if (result.categories[i].id === result.productCategories[j].id) {
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
        res.send("Not Found").status(400);
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
  const params = req.body;
  const queryParams = req.params;
  params.id = queryParams.id;
  const categories = params.categories;
  delete params['categories'];

  //TODO: Form filter&validation operation required!

  waterfall(
    [
      function(waterfallCallback) { // Saving Product Data to MySQL DB
        productService.update(params, function(err, changedRows) {
          if (err) { res.redirect('/product'); }
          productService.upsertCategories(queryParams.id, categories, function(err) {
            waterfallCallback(false);
            return;
          });
        });
      },
      function(waterfallCallback) {
        push_queue.push('product_updates', {'action':'update', 'productId': queryParams.id}, () => {
          waterfallCallback(false);
        });
      }
    ],
    function(err, product) {
      if (err) {}
      res.redirect('/product/id/' + queryParams.id);
      return;
    }
    );
});

module.exports = router;
