var mongoose = require("mongoose");

var timeSpanSchema = new mongoose.Schema({
    pid: {type: mongoose.Schema.Types.ObjectId, ref: "Patient"},
    name : String,
    type : Number,
    consultTime : {type : Number, default:null},
    billTime : {type : Number, default:null},
    mediTime : {type : Number, default:null},
    Date : {type : Date , default : Date.now()}
});



module.exports = mongoose.model("TimeSpanData", timeSpanSchema);