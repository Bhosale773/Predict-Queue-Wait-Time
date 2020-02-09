var mongoose = require("mongoose");

var timeSpanSchema = new mongoose.Schema({
    pid: {type: mongoose.Schema.Types.ObjectId, ref: "RegPatient"},
    name : String,
    type : Number,
    consultTime : {type : Number, default: 0},
    billTime : {type : Number, default: 0},
    mediTime : {type : Number, default: 0},
    Date : {type : Date , default : Date.now()}
});



module.exports = mongoose.model("TimeSpanData", timeSpanSchema);