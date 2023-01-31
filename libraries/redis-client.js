var redis = require('redis');
  client = redis.createClient({'host': process.env.REDIS_HOST});

await client.connect();

const RedisClient = {
  getClient: function() {
    return client;
  },

  push: function(key, value, callback) {
    client.lpush(key, value, function(err, result) {
      callback(err, result);
    });
  },

  pop: function() {
    client.brpop(key, value, function(err, result) {
      callback(err, result);
    });
  },

  set: function(key, value, ttl) {
    if (value) {
      client.set(key, JSON.stringify(value), 'EX', ttl);
    }
  },

  get: function(key, callback) {
    client.get(key, function(err, result) {
      if (result) {
        callback(err, JSON.parse(result));
        return;
      }
      callback(true, {});
    });
  },

  delete: function() {
    client.delete(key);
  }
}


module.exports = RedisClient;