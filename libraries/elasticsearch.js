const { Client } = require('@elastic/elasticsearch');
const client = new Client({
  node: process.env.ELASTIC_HOST,
  log: process.env.ELASTIC_LOG
});

module.exports = client;