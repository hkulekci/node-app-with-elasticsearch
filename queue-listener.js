#!/usr/bin/env node

require('dotenv').config();
var productService = require('./services/productService');
var categoryService = require('./services/categoryService');
var productSearchService = require('./services/productSearchService');
var redisClient = require('./libraries/redis-client');
var RedisQueue = require("simple-redis-queue");
var waterfall = require('async/waterfall');

var pop_queue = new RedisQueue(redisClient.getClient());

var upsertOperation = function(productId, functionCallback) {
  waterfall([
    // Insert Operation
    function(waterfallCallback) { // Getting Product Category From DB (Preparing for Elasticsearch)
      var result = {};
      categoryService.getProductCategories(productId, function(err, productCategories) {
        if (err) {}
        result.productCategories = productCategories;
        waterfallCallback(false, result);
      });
    },
    function(result, waterfallCallback) { // Getting Product Data From MySQL DB (Preparing for Elasticsearch)
      productService.getRecord(productId, function(err, product) {
        if (err) {}
        result.product = product;
        waterfallCallback(false, result);
      });
    },
    function(result, waterfallCallback) { // Saving Product to Elasticsearch
      var product = result.product;
      product.categories = result.productCategories;

      productSearchService.insert(product, function() {
        waterfallCallback(false, product);
      });
    },
    function(err, result) {
      functionCallback(err, result);
    }
  ]);
};

var deleteOperation = function(productId, functionCallback) {
    // Delete Operation
    productSearchService.delete(productId, function(err, result) {
      functionCallback(false);
    });
};


/***** Redis Message Queue Listener ******/
pop_queue.on("message", function (queueName, payload) {
  var messageData = JSON.parse(payload);
  if (messageData.action == 'update' || messageData.action == 'insert') {
    upsertOperation(messageData.productId, function() {
      console.log('[' + queueName + '] - Processed! - ' + payload);
      pop_queue.next("product_updates");
    });
  } else if (messageData.action == 'delete') {
    deleteOperation(messageData.productId, function() {
      console.log('[' + queueName + '] - Processed! - ' + payload);
      pop_queue.next("product_updates");
    });
  } else {
    console.log('[' + queueName + '] - Not Processed! - ' + payload);
    pop_queue.next("product_updates");
  }
});

// Listen for errors
pop_queue.on("error", function (error) {
    console.log("pop_queue Error : " + error);
});

pop_queue.next("product_updates");