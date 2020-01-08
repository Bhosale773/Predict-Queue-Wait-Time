var mongoose = require("mongoose");

var ConsultationQueueSchema = new mongoose.Schema({
    username: String
});

module.exports = mongoose.model("Consultation", ConsultationQueueSchema);