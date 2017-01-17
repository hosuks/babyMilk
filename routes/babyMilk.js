var express = require("express");
var router = express.Router();
var app = express();
var request = require("request");
var cheerio = require("cheerio");
var moment = require("moment");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var BabyMilk = require("../models/BabyMilk");

mongoose.connect(process.env.MONGO_DB); // 1
var db = mongoose.connection;

db.once("open", function(){
    console.log("DB connected");
});
db.on("error", function(err){
    console.log("DB ERROR : ", err);
});

router.use(bodyParser.json()); // support json encoded bodies
router.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//-- 토큰 저장
router.route("/fcm/register").post(function(req, res){

  //console.log(req.body.token);
  BabyMilk.create({ token:req.body.token, regDate:moment().format('YYYY-MM-DD HH:mm:ss')}, function(err, BabyMilk){
       if(err) {
         return res.json(err);
       }
  });
  console.log("token === " + req.body.token);
});
//-- 푸쉬 발송
router.route("/fcm/send").post(function(req, res){
  app.use(bodyParser.urlencoded({ extended: false })); // support encoded bodies
  var token = new Array();
  var title = req.body.title;
  var msg = req.body.message;

  console.log('title === ' + title);
  console.log('msg === ' + msg);

  if (title == null || title == '') {
    title = '분유싸다';
  }

  if (msg == null || msg == '') {
    msg = '우리 아기 분유 최저가를 확인하세요.';
  }

  BabyMilk.find({}, function(err, babyMilk){
    babyMilk.forEach(function(data){
      token.push(data.token);
    });

    var FCM = require('fcm-node');

    var serverKey = 'AAAAUKpdM-8:APA91bHJ4pbgyBfHoJLjTTSqE3i6VJgjgAsAA2kxae7X92SgZEXwWS9ym2hMcMbpXHcRD_FzS312e-58Ef9tEcAtoH9RadcL_CCP678iuVf6vLlZNmN-FduwW0hGHpf3t9dQ0OJNtrx7';
    var fcm = new FCM(serverKey);

    for(var i = 0; i < token.length; i++) {
      console.log(token[i]);
      var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
          to: token[i],
          collapse_key: 'your_collapse_key',

          notification: {
              title: title,
              body: msg
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

router.route("/").get(function(req, res){
    res.render("babyMilk");
});

//-- APP 업데이트 완료되면 삭제 (임시용)
router.route("/:keyword").get(function(req, res){
    res.redirect("/babyMilk");
});

router.route("/:keyword").post(function(req, res){
  var wmpUrl = "http://www.wemakeprice.com/search?search_cate=top&search_keyword=" + encodeURIComponent(req.params.keyword) + "&_service=5&_type=3";
  var wmpDealImg = [];
  var wmpPrice = [];
  var wmpLinkUrl = [];

  // WMP
  request(wmpUrl, function(error, response, body){
      if (error) throw error;

      var $ = cheerio.load(body);
      var dealImg = $("img.lazy");
      var price = $("span.sale");
      var linkUrl = $("span.type03");

      dealImg.each(function(){
          //console.log($(this).attr('original')+"<br>");
          wmpDealImg.push($(this).attr('original'));
      });

      price.each(function(){
          wmpPrice.push($(this).text());
      });

      linkUrl.each(function(){
          wmpLinkUrl.push('http://www.wemakeprice.com/' + $(this).find('a').attr('href'));
      });

      var cpUrl = "http://www.coupang.com/np/search?q=" + encodeURIComponent(req.params.keyword) + "&channel=user";
      var cpDealImg = [];
      var cpPrice = [];
      var cpLinkUrl = [];
      var cpUnitPrice = [];

      // COUPANG
      request(cpUrl, function(error, response, body){
          if (error) throw error;

          var $ = cheerio.load(body);
          var dealImg = $("dt.image");
          var price = $("span.rocket");
          var linkUrl = $("li.search-product");
          var unitPrice = $("span.rocket");

          dealImg.each(function(){
              //console.log("http:" + $(this).find('img').attr('src')+"<br>");
              cpDealImg.push("http:" + $(this).find('img').attr('src'));
          });

          price.each(function(){
              //console.log($(this).parent().find('strong.price-value').text()+"<br>");
              cpPrice.push($(this).parent().find('strong.price-value').text()+"원");
          });

          linkUrl.each(function(){
              cpLinkUrl.push('http://www.coupang.com' + $(this).find('a').attr('href'));
          });

          unitPrice.each(function(){
              cpUnitPrice.push($(this).parent().next().find('em').last().text());
          });

          var tmUrl = "http://search.ticketmonster.co.kr/search/?keyword=" + encodeURIComponent(req.params.keyword) + "&thr=ts";
          var tmDealImg = [];
          var tmPrice = [];
          var tmLinkUrl = [];

          // TMON
          request(tmUrl, function(error, response, body){
              if (error) throw error;

              var $ = cheerio.load(body);
              var dealImg = $("div.deal_item_thumb");
              var price = $("span.deal_item_price");
              var linkUrl = $("a.deal_item_anchor");

              dealImg.each(function(){
                  // console.log($(this).find('img').attr('src')+"<br>");
                  tmDealImg.push($(this).find('img').attr('src'));
              });

              price.each(function(){
                  // console.log($(this).find('em').text()+"<br>");
                  tmPrice.push($(this).find('em').first().text()+"원");
              });

              linkUrl.each(function(){
                  tmLinkUrl.push($(this).attr('href')+"원");
              });

              var dataObject = {
                  wmpDealImg : wmpDealImg,
                  wmpPrice : wmpPrice,
                  wmpLinkUrl : wmpLinkUrl,
                  cpDealImg : cpDealImg,
                  cpPrice : cpPrice,
                  cpLinkUrl : cpLinkUrl,
                  cpUnitPrice : cpUnitPrice,
                  tmDealImg : tmDealImg,
                  tmPrice : tmPrice,
                  tmLinkUrl : tmLinkUrl
              };
              res.send(dataObject);
      });
    });
  });
});

module.exports = router;
