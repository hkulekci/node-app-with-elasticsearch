#!/usr/bin/env node

require('dotenv').config();
const db = require('./libraries/database');
const redisClient = require('./libraries/redis-client');
const RedisQueue = require('hkulekci-simple-redis-queue');

const push_queue = new RedisQueue(redisClient.getClient());

const getAllProductIds = (callback) => {
    let sql = "SELECT p.id FROM products p";

    db.getConnection(function(err, connection) {
        if(err) { console.log(err); callback(true); return; }
        // make the query
        connection.query(sql, {}, function(err, results) {
            connection.release();
            if(err) { console.log(err); callback(true); return; }
            callback(false, results);
        });
    });
}


console.log(getAllProductIds((err, response) => {
    if (!err) {
        for (const index in response) {
            const product = response[index]
            push_queue.push('product_updates', {'action':'insert', 'productId': product.id}, ((err, res) => {
                console.log('Product sent to queue : ' + product.id)
            }));
        }
    }
}))