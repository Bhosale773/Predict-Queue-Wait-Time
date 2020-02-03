var mongoose = require("mongoose");

var WalkInSchema = new mongoose.Schema({
    pid: {type: mongoose.Schema.Types.ObjectId, ref: "Patient"},
    name : String,
    consultTime : Number,
    billTime : Number,
    mediTime : Number,
    Date : {type : Date , default : Date.now()}
});



module.exports = mongoose.model("WalkInTime", WalkInSchema);