var mongoose = require("mongoose");

var algoDataSchema = new mongoose.Schema({
    consultAvg : {type : Number , default : 600},
    mediAvg : {type : Number , default : 90},
    billAvg : {type : Number , default : 60}

});

module.exports = mongoose.model("AlgoData", algoDataSchema);