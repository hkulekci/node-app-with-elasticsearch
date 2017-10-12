var db = require('./../libraries/database');
var dateTime = require('node-datetime');
var every = require('async/every');
var waterfall = require('async/waterfall');

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

exports.insert = function(sqlData, callback) {
  var dt = dateTime.create();
  var formatted = dt.format('Y-m-d H:M:S');

  sqlData.updated_at = formatted;
  var sql = "INSERT INTO products SET ?";
  db.getConnection(function(err, connection) {
    if(err) { console.log(err); callback(true); return; }
    connection.query(sql, sqlData, function(err, results, fields) {
      if(err) { console.log(err); callback(true); return; }
      callback(false, results.insertId);
    });
  });
};


exports.upsertCategories = function(productId, categories, callback) {
  waterfall(
    [
      function(waterfallCallback) {
        db.getConnection(function(err, connection) {
          if(err) { console.log(err); waterfallCallback(true); return; }
          connection.query("DELETE FROM product_category WHERE product_id = ?", [productId], function(err, results) {
            if(err) { console.log(err); waterfallCallback(true); return; }
            waterfallCallback(false);
          });
        });
      },
      function(waterfallCallback) {
        every(categories, function(category, eachCallback) {
          var sql = "INSERT INTO product_category SET ?";
          db.getConnection(function(err, connection) {
            if(err) { console.log(err); eachCallback(true); return; }
            connection.query(sql, {'product_id': productId, 'category_id': category}, function(err, results, fields) {
              if(err) { console.log(err); eachCallback(true); return; }
              eachCallback(false);
            });
          });
        },
        function(err, result) {
          waterfallCallback(err);
        });
      }
    ],
    function(err, results) {
      callback(err);
    }
  );
};


exports.update = function(sqlData, callback) {
  var sql = "UPDATE products SET name = ?, description = ?, price = ?, quantity = ? WHERE id = ?;";
  var params = [sqlData.name, sqlData.description, sqlData.price, sqlData.quantity, sqlData.id];
  db.getConnection(function(err, connection) {
    if(err) { console.log(err); callback(true); return; }
    connection.query(sql, params, function(err, results, fields) {
      if(err) { console.log(err); callback(true); return; }
      callback(false, results.changedRows);
    });
  });
};




exports.delete = function(productId, callback) {
  var sql = "DELETE FROM product_category WHERE product_id = ?;";
  var params = [productId];
  db.getConnection(function(err, connection) {
    if(err) { console.log(err); callback(true); return; }
    connection.query(sql, params, function(err, results, fields) {
      if(err) { console.log(err); callback(true); return; }
      var psql = "DELETE FROM products WHERE id = ?;";
      var pparams = [productId];
      connection.query(psql, pparams, function(err, results, fields) {
        callback(false, results.changedRows);
      });

    });
  });
};