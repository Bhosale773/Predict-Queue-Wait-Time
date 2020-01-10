var mongoose = require("mongoose");

var DateSchema = new mongoose.Schema({
    decisionDate: {type: Date, default: undefined},
    token: Number
});

module.exports = mongoose.model("Date", DateSchema);