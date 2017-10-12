var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: process.env.ELASTIC_HOST,
  log: process.env.ELASTIC_LOG
});

module.exports = client;