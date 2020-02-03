var mongoose = require("mongoose");

var AppointmentSchema = new mongoose.Schema({
    pid: {type: mongoose.Schema.Types.ObjectId, ref: "Patient"},
    name: String,
    date: Date,
    type: String,
    token: Number
});


module.exports = mongoose.model("Appointment", AppointmentSchema);