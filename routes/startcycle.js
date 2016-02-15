var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
require('dotenv').load();
var mongodb = require('mongodb');

var startTime;

var url = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/pidatabase';
/* GET home page. */
router.post('/', function(req, res, next) {
  var password = req.body.password;
  if(bcrypt.compareSync(process.env.SERVER_SECRET,password)){
    if(req.body.schedule){
      console.log(req.body.schedule);
      mongodb.MongoClient.connect(url,function(err,db){
        if(err){
          throw err;
        }
        var schedule = db.collection('schedule');
        schedule.remove();
        schedule.insert({schedule:req.body.schedule},function(err,data){
          if(err){
            throw err;
          }
          startTime = Date.now();
          //Open socket to backend server

          monitorCycle();
          res.send('started cycle')
        })
      })

    }
    else{
      res.send('error no schedule')
    }
  }
  else{
    res.send('Not a valid password');
  }
});

function monitorCycle(){
  var currentTime = Date.now();
  var timeElapsed = currentTime - startTime;
  var setTemp;

  mongodb.MongoClient.connect(url,function(err,db){
    if(err){
      //socket emit
    }
    var schedule = db.collection('schedule');
    schedule.find().toArray(function(err,results){
      var scheduleArray = JSON.parse(results[0].schedule);
      console.log(scheduleArray);
      for(var i = 0; i < scheduleArray.length; i++){
        if(scheduleArray[i][0] <= timeElapsed){
          if(!setTemp){
            setTemp = scheduleArray[i][1];
            var setTime = scheduleArray[i][0];
          }
          else{
            if(scheduleArray[i][0] > setTime){
              setTemp = scheduleArray[i][1];
            }
          }
        }
      }
      console.log(setTemp);
    })
  })

}

module.exports = {
  router:router,
  startTime:startTime
}
