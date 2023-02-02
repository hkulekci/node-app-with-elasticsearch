const redis = require('redis');
  client = redis.createClient({'url': process.env.REDIS_HOST});

const RedisClient = {
  getClient: function() {
    if (!client.isOpen) {
      client.connect().then()
    }
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

  get: async function(key) {
    if (!client.isOpen) {
      await client.connect()
    }
    const value = await client.get(key);

    if (value !== null) {
      return JSON.parse(value);
    }

    return null;
  },

  delete: function() {
    client.delete(key);
  }
}


module.exports = RedisClient;