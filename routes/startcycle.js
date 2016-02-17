var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
require('dotenv').load();
var mongodb = require('mongodb');
var io = require('socket.io-client');
var ds18b20 = require('ds18b20');
var Gpio = require('onoff').Gpio;
var startTime;
var socket;
var compressor = new Gpio(16, 'out');

router.get('/', function(req, res){
  bcrypt.hash(process.env.SERVER_SECRET, 0, function(err, hash){
    res.send(hash)
  })
})

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
        var logs = db.collection('log');
        logs.remove();
        var schedule = db.collection('schedule');
        schedule.remove();
        schedule.insert({schedule:req.body.schedule},function(err,data){
          if(err){
            throw err;
          }
          startTime = Date.now();
          //Open socket to backend server
          socket = io.connect(process.env.NODE_URL);
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
  var timeElapsed = (currentTime - startTime)/1000;
  var setTemp;

  mongodb.MongoClient.connect(url,function(err,db){
    if(err){
      //socket emit
    }
    var schedule = db.collection('schedule');
    schedule.find().toArray(function(err,results){
      var scheduleArray = JSON.parse(results[0].schedule);
      for(var i = 0; i < scheduleArray.length; i++){
        if(scheduleArray[i][0] <= timeElapsed){
          console.log('scheduleArray = '+scheduleArray[i][0]+'  '+timeElapsed);
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
      if(scheduleArray[scheduleArray.length-1][0] < timeElapsed){
        finishCycle();
        return;
      }
      var piTemp = CheckPiTemp();
      console.log(piTemp)
      var compressorOn = true;
      if(piTemp - setTemp > 2){
        compressorCycle(true);
      }
      else if(piTemp - setTemp < 0){
        compressorCycle(false);
      }
      //Create object
      var logData = {
        time:timeElapsed,
        setTemp:setTemp,
        beerTemp:piTemp,
        compressorOn:compressorOn
      }
      var logs = db.collection('log');
      logs.update({ _id: 1 }, { "$push":
       { log: logData }}, { upsert: true }, function(data){
         console.log(data);
       })

      //Send data through sockets
      socket.emit('logData',logData);
        setTimeout(monitorCycle,5000);
      // })
    })
  })

}
function CheckPiTemp(){
  ds18b20.sensors(function(err, ids) {
    var serialNumber = ids[0];
  });
    return ds18b20.temperatureSync(serialNumber);
}

function finishCycle(){
  compressorCycle(false);
  socket.disconnect();
}

function compressorCycle(value){
  if(value){
    compressor.writeSync(1);
  }else{
    compressor.writeSync(0);
  }
}

module.exports = {
  router:router,
  startTime:startTime
}
