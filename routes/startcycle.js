var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
require('dotenv').load();



/* GET home page. */
router.post('/', function(req, res, next) {
  var password = req.body.password;
  if(bcrypt.compareSync(process.env.SERVER_SECRET,password)){
    res.send('valid password');
  }
  else{
    res.send('Not a valid password');
  }
});

module.exports = router;
