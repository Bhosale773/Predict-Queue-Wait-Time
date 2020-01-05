var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var HseSchema = new mongoose.Schema({
    username: { type : String , index: { unique: true }, required : true},
    password: String
});

HseSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("HSE", HseSchema);