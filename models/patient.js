var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var PatientSchema = new mongoose.Schema({
    username: { type : String , index: { unique: true }, required : true},
    password: String,
    fname: String,
    lname: String,
    age: Number,
    gender: String,
    contact: String,
    email: String,
    address: String
});

PatientSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Patient", PatientSchema);