var express = require('express');
var router = express.Router();
var productService = require('../services/productService');
var categoryService = require('../services/categoryService');
var waterfall = require('async/waterfall');
var productSearchService = require('../services/productSearchService');
var redisClient = require('../libraries/redis-client');
var md5 = require('blueimp-md5');
const { Message, Producer } = require('redis-smq');

const pushQueue = (data, callback) => {
  const producer = new Producer();
  producer.run((err) => {
    if (err) throw err;
    const message = new Message();
    message
      .setBody(data)
      .setQueue('product_updates'); // setting up a direct exchange
    message.getId() // null
    producer.produce(message, (err) => {
      if (err) {
        console.log(err);
        callback(true, err)
      }
      else {
        const msgId = message.getId(); // string
        callback(false, msgId)
      }
    });
  })
}

/* GET products listing. */
router.get('/', function(req, res, next) {
  var queryParams = req.query;
  waterfall([
    function(waterfallCallback) {
      redisClient.get(md5(queryParams), function(err, results) {
        if (err) { console.log(err); waterfallCallback(); return; }
        if (results) {
          res.render('products', {'title': 'Products', products: results, 'totalCount': results.length, 'cache': true});
          return;
        }
        waterfallCallback();
      });
    },
    function(waterfallCallback) {
      productService.getRecords(queryParams, function(err, results) {
        if(err) { res.send(500,"Server Error"); return; }
        redisClient.set(md5(queryParams), results, 100);
        // Respond with results as JSON
        res.render('products', {'title': 'Products', products: results, 'totalCount': results.length,  'cache': false});

      });
    }
  ]);
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
      function(waterfallCallback) { // Saving Product to MySQL DB
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
        pushQueue({'action':'insert', 'productId': result.insertId}, (err, result) => {
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
        pushQueue({'action':'delete', 'productId': params.id}, (err, result) => {
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
        for (i in result.categories) {
          for (j in result.productCategories) {
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
  const params = req.body;
  const queryParams = req.params;
  params.id = queryParams.id;
  const categories = params.categories;
  delete params['categories'];

  //TODO: Form filter&validation opearation required!

  waterfall(
    [
      function(waterfallCallback) { // Saving Product Data to MySQL DB
        productService.update(params, function(err, changedRows) {
          if (err) { res.redirect('/product'); }
          productService.upsertCategories(queryParams.id, categories, function(err) {
            waterfallCallback(false);
            return;
          })
        });      
      },
      function(waterfallCallback) {
        pushQueue({'action':'update', 'productId': queryParams.id}, () => {
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
