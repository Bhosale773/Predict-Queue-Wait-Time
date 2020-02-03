var mongoose = require("mongoose");

var AppointmentSchema = new mongoose.Schema({
    pid: {type: mongoose.Schema.Types.ObjectId, ref: "Patient"},
    date: Date,
    type: String,
    token: Number,
    time : Number
});


module.exports = mongoose.model("Appointment", AppointmentSchema);