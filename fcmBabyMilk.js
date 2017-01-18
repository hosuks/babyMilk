var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var schedule = require("node-schedule");
var BabyMilk = require("./models/BabyMilk");
var FCM = require('fcm-node');

var j = schedule.scheduleJob('10 10 * * *', function(){
  mongoose.connect(process.env.MONGO_DB); // 1
  var db = mongoose.connection;

  db.once("open", function(){
    console.log("DB connected");
  });
  db.on("error", function(err){
    console.log("DB ERROR : ", err);
  });

  var token = new Array();

  BabyMilk.find({}, function(err, babyMilk){
    babyMilk.forEach(function(data){
      token.push(data.token);
    });

    var serverKey = 'AAAAUKpdM-8:APA91bHJ4pbgyBfHoJLjTTSqE3i6VJgjgAsAA2kxae7X92SgZEXwWS9ym2hMcMbpXHcRD_FzS312e-58Ef9tEcAtoH9RadcL_CCP678iuVf6vLlZNmN-FduwW0hGHpf3t9dQ0OJNtrx7';
    var fcm = new FCM(serverKey);

    for(var i = 0; i < token.length; i++) {
      var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
          to: token[i],
          collapse_key: 'your_collapse_key',

          notification: {
              title: '분유싸다',
              body: '[실시간]우리 아기 분유 최저가를 확인하세요.'
          },

          data: {  //you can send only notification or only data(or include both)
              my_key: 'my value',
              my_another_key: 'my another value'
          }
      };

      fcm.send(message, function(err, response){
          if (err) {
              console.log("Something has gone wrong!");
          } else {
              console.log("Successfully sent with response: ", response);
          }
      });
    }
  });
});
