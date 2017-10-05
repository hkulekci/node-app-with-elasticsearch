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