var express = require('express');
var router = express.Router();
require('dotenv').load();
var mongodb = require('mongodb');
var bcrypt = require('bcrypt');

var url = 'mongodb://localhost:27017/pidatabase';

/* GET users listing. */
router.get('/', function(req, res, next) {
  mongodb.MongoClient.connect(url,function(err,db){
    if(err){
      throw err;
    }
    var logs = db.collection('log');
    logs.find({}).toArray(function(err, log){
      res.json(log);
    })
  });
});

module.exports = router;
