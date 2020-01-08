var mongoose = require("mongoose");

var RegPatientSchema = new mongoose.Schema({
    pid: {type: mongoose.Schema.Types.ObjectId, ref: "Patient"},
    date: {type: Date, default: Date.now()},
    stage1: {
        date: {type: Date, default: Date.now()},
        isGone: {type: Boolean, default: false}
    },
    stage2: {
        inTime: {
            date: {type: Date, default: Date.now()},
            isGone: {type: Boolean, default: false}
        },
        outTime: {
            date: {type: Date, default: Date.now()},
            isGone: {type: Boolean, default: false}
        }
    },
    stage3: {
        date: {type: Date, default: Date.now()},
        isGone: {type: Boolean, default: false}
    },
    stage4: {
        date: {type: Date, default: Date.now()},
        isGone: {type: Boolean, default: false}
    }
});

module.exports = mongoose.model("RegPatient", RegPatientSchema);