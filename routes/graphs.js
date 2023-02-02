const express = require('express');
const router = express.Router();
const productGraphService = require('../services/productGraphService');
const waterfall = require('async/waterfall');

var dynamicColors = function() {
  var r = Math.floor(Math.random() * 255);
  var g = Math.floor(Math.random() * 255);
  var b = Math.floor(Math.random() * 255);
  return "rgb(" + r + "," + g + "," + b + ")";
};


router.get('/', function(req, res, next) {

  waterfall(
    [
      function(waterfallCallback) {
        productGraphService.getProductCountByDate({}, function(err, result) {
          if(err) { waterfallCallback(true, {}); }
          let colors = [];
          for (let i in result['vals']) {
            colors.push(dynamicColors());
          }
          waterfallCallback(false, {"chart1": {'labels':'"' + result['keys'].join('","') + '"', 'datasets': [ {'data': result['vals'].join(','), 'label': 'Num of Product', 'colors': '"'+colors.join('","')+'"'} ]}});
          return;
        });
      },
      function(data, waterfallCallback) {
        productGraphService.getProductQuantities({}, function(err, result) {
          if(err) { waterfallCallback(true, {}); }
          let colors = [];
          for (let i in result['vals']) {
            colors.push(dynamicColors());
          }
          data['chart2'] = {'labels':'"' + result['keys'].join('","') + '"', 'datasets': [ {'data': result['vals'].join(','), 'label': 'Total Product Quantity', 'colors': '"'+colors.join('","')+'"'}, {'data': result['counts'].join(','), 'label': 'Num of Product'} ]};
          waterfallCallback(false, data);
          return;
        });  
      },
      function(data, waterfallCallback) {
        productGraphService.getCategoriyQuantitySum({}, function(err, result) {
          if(err) { waterfallCallback(true, {}); }
          let colors1 = [];
          let colors2 = [];
          for (let i in result['vals']) {
            colors1.push(dynamicColors());
          }

          for (let i in result['counts']) {
            colors2.push(dynamicColors());
          }
          data['chart3'] = {'labels':'"' + result['keys'].join('","') + '"', 'datasets': [ {'data': result['vals'].join(','), 'label': 'Total Quantity of Category', 'colors': '"'+colors1.join('","')+'"'  }, {'data': result['counts'].join(','), 'label': 'Num of Product by Category', 'colors': '"'+colors2.join('","')+'"'} ]};
          waterfallCallback(false, data);
          return;
        });  
      }
    ],
    function(err, data) {
      if(err) { res.send(500,"Server Error"); return; }
      console.log(data);
      res.render('graphs', data);
    }
  );
  return;
});

module.exports = router;
