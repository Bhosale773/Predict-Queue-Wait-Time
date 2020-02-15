var RegPatient            = require("./models/regPatient");
var mongoose = require("mongoose");
var dotenv                = require("dotenv");

dotenv.config();
mongoose.set('useCreateIndex', true);
mongoose.connect("mongodb://localhost:27017/pqt_db",{useNewUrlParser:true, useUnifiedTopology: true});
//mongoose.connect(process.env.DATABASEURL, {useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

RegPatient.create({
    pid: process.env.EMERGENCY,
    visit_type: 'emergency',
    reason: 0,
    name: "Emergency Case",
    token: 1,
    stage1: {
        isInQueue: true
    }
},function(err,f){}); 