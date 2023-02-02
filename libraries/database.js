const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
  port: process.env.MYSQL_PORT,
  debug: process.env.MYSQL_DEBUG == 'true' ? true : false,
  connectionLimit: 10,
  supportBigNumbers: true,
  insecureAuth: true, // *** dont use production. ***
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0
});

module.exports = pool;