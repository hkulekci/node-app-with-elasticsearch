#!/usr/bin/env node

require('dotenv').config();
const productService = require('./services/productService');
const categoryService = require('./services/categoryService');
const productSearchService = require('./services/productSearchService');
const waterfall = require('async/waterfall');
const RedisQueue = require('hkulekci-simple-redis-queue');
const redisClient = require("./libraries/redis-client");

const pop_queue = new RedisQueue(redisClient.getClient());


const upsertOperation = function(productId, functionCallback) {
  waterfall([
    // Insert Operation
    function(waterfallCallback) { // Getting Product Category From DB (Preparing for Elasticsearch)
      let result = {};
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
      let product = result.product;
      product.categories = result.productCategories;

      let input = product.name.trim().split(' ');
      product.completion = {
        "input": input
      };
      productSearchService.insert(product, function() {
        waterfallCallback(false, product);
      });
    },
  ],
  function(err, result) {
    functionCallback(err, result);
  });
};

const deleteOperation = function(productId, functionCallback) {
    // Delete Operation
    productSearchService.delete(productId, function(err, result) {
      functionCallback(false);
    });
};

/***** Redis Message Queue Listener ******/
pop_queue.on('message', (queueName, payload) => {
  const messageData = JSON.parse(payload);

  if (messageData.action === 'update' || messageData.action === 'insert') {
    upsertOperation(messageData.productId, function() {
      console.log('[product_updates] - Processed! - ' + payload);
      pop_queue.next(queueName)
    });
  } else if (messageData.action === 'delete') {
    deleteOperation(messageData.productId, function() {
      console.log('[product_updates] - Processed! - ' + payload);
      pop_queue.next(queueName)
    });
  } else {
    console.log('[product_updates] - Not Processed! - ' + payload);
    pop_queue.next(queueName)
  }
});

pop_queue.on('error', (err) => {
  console.log(err)
});

pop_queue.next('product_updates');