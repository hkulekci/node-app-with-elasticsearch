var db = require('./../libraries/database');

exports.getRecords = function(params, callback) {
  var sql = "SELECT p.* FROM products p LEFT JOIN product_category pc ON pc.product_id = p.id LEFT JOIN categories c ON c.id = pc.category_id";
  var sqlParams = [];

  var sqlExtras = [];
  if (params.category) {
    sqlExtras.push({'sql': ' WHERE pc.category_id = ?', 'params': [params.category]});
  }
  if (params.keyword) {
    sqlExtras.push({'sql': ' WHERE (p.name LIKE ? OR p.description LIKE ?)', 'params': ['%'+params.keyword+'%', '%'+params.keyword+'%']});
  }
  if (sqlExtras.length >= 1) {
    for (e in sqlExtras) {
      sql += sqlExtras[e].sql;
      for (p in sqlExtras[e].params) {
        sqlParams.push(sqlExtras[e].params[p]);
      }
    }
  }
  sql += ' GROUP BY p.id LIMIT 50';
  console.log(sql);
  // get a connection from the pool
  db.getConnection(function(err, connection) {
    if(err) { console.log(err); callback(true); return; }
    // make the query
    connection.query(sql, sqlParams, function(err, results) {
      connection.release();
      if(err) { console.log(err); callback(true); return; }
      callback(false, results);
    });
  });
};

exports.getRecord = function(id, callback) {
  var sql = "SELECT * FROM products WHERE id = ?";
  // get a connection from the pool
  db.getConnection(function(err, connection) {
    if(err) { console.log(err); callback(true); return; }
    // make the query
    connection.query(sql, [id], function(err, results) {
      connection.release();
      if(err) { console.log(err); callback(true); return; }
      if (results.length >= 1) {
        callback(false, results[0]);
        return;
      }
      callback(false, undefined);
      return;
    });
  });
};