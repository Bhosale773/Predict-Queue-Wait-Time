var mongoose = require("mongoose");

var algoDataSchema = new mongoose.Schema({
    consultAvg : {type : Number , default : 600},
    mediAvg : {type : Number , default : 90},
    billAvg : {type : Number , default : 60},
    aAvg : {type : Number , default : 600},
    bAvg : {type : Number , default : 600},
    cAvg : {type : Number , default : 600},
    dAvg : {type : Number , default : 600}

});

module.exports = mongoose.model("AlgoData", algoDataSchema);