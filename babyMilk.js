var express = require("express");
var app = express();

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

// Routes
app.use("/babyMilk", require("./routes/babyMilk"));

app.listen(9010, function(){
   console.log('9010 port Server On!');
});
