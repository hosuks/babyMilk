var mongoose = require("mongoose");

// DB schema
var babyMilkSchema = mongoose.Schema({
  token : { type : String, require : true },
  regDate: { type : String, require : true }
});

var BabyMilk = mongoose.model("babyMilk", babyMilkSchema);

module.exports = BabyMilk;
