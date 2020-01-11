var mongoose = require("mongoose");

var RegPatientSchema = new mongoose.Schema({
    pid: {type: mongoose.Schema.Types.ObjectId, ref: "Patient"},
    name: String,
    token: Number,
    stage1: {
        isInQueue: {type: Boolean, default: false},
        date: {type: Date, default: undefined},
        isGone: {type: Boolean, default: false}
    },
    stage2: {
        isActive: {type: Boolean, default: false},
        inTime: {
            date: {type: Date, default: undefined},
            isGone: {type: Boolean, default: false}
        },
        outTime: {
            date: {type: Date, default: undefined},
            isGone: {type: Boolean, default: false}
        }
    },
    stage3: {
        isActive: {type: Boolean, default: false},
        date: {type: Date, default: undefined},
        isGone: {type: Boolean, default: false}
    },
    stage4: {
        isActive: {type: Boolean, default: false},
        date: {type: Date, default: undefined},
        isGone: {type: Boolean, default: false}
    }
});

module.exports = mongoose.model("RegPatient", RegPatientSchema);