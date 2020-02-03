var mongoose = require("mongoose");

var AppointmentSchema = new mongoose.Schema({
    pid: {type: mongoose.Schema.Types.ObjectId, ref: "Patient"},
    name : String,
    type : String,
    consultTime : Number,
    billTime : Number,
    mediTime : Number,
    Date : {type : Date , default : Date.now()}
});



module.exports = mongoose.model("AppointmentTime", AppointmentSchema);