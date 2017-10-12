var db = require('./../libraries/database');

exports.getRecords = function(callback) {
  var sql = "SELECT * FROM categories";
  // get a connection from the pool
  db.getConnection(function(err, connection) {
    if(err) { console.log(err); callback(true); return; }
    // make the query
    connection.query(sql, [], function(err, results) {
      connection.release();
      if(err) { console.log(err); callback(true); return; }
      callback(false, results);
    });
  });
};


exports.getProductCategories = function(productId, callback) {
  var sql = "SELECT * FROM product_category WHERE product_id = ?;";
  // get a connection from the pool
  db.getConnection(function(err, connection) {
    if(err) { console.log(err); callback(true); return; }
    // make the query
    connection.query(sql, [productId], function(err, results) {
      connection.release();
      if(err) { console.log(err); callback(true); return; }
      categories = [];
      for (index in results) {
        categories.push(results[index]['category_id']);
      }
      connection.query("SELECT * FROM categories WHERE id IN (?)", [categories], function(err, productCategories) {
        callback(false, productCategories);
      });
    });
  });
};