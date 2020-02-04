// importing packages

var express               = require("express");
var app                   = express();
var fs                    = require('fs')
var https                 = require('https')
var mongoose              = require("mongoose");
var bodyParser            = require("body-parser");
var passport              = require("passport");
var LocalStrategy         = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var flash                 = require("connect-flash");
var bcrypt                = require("bcryptjs");
var dotenv                = require("dotenv");

dotenv.config();


// importing database models

var HSE                   = require("./models/hse");
var Patient               = require("./models/patient");
var RegPatient            = require("./models/regPatient");
var DecisionDate          = require("./models/date");
var Appointment           = require("./models/appointment");


// importing routes

var indexRoutes           = require("./routes/index");
var patientRoutes         = require("./routes/patients");
var hseRoutes             = require("./routes/hses");


// declare variables

var curr_date;


// database connection url

mongoose.set('useCreateIndex', true);
mongoose.connect("mongodb://localhost:27017/pqt_db",{useNewUrlParser:true, useUnifiedTopology: true});
// mongoose.connect(process.env.DATABASEURL, {useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);


// server runtime properties

app.set("view engine", "ejs");

app.use(flash());

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({extended: true}));

app.use(require("express-session")({
    secret: "This is secret code",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


//authentication strategies

passport.use('patient', new LocalStrategy(function(username, password, done){
    var query = {"username": username};
    Patient.findOne(query, function(err, patient){
        if(err) throw err;
        if(!patient){
            return done(null, false);
        }
        bcrypt.compare(password, patient.password, function(err, isMatch){
            if(err) throw err;
            if(isMatch)
                return done(null, patient);
            else
                return done(null,false);
        });
    });
}));

passport.use('hse', new LocalStrategy(function(username, password, done){
    var query = {"username": username};
    HSE.findOne(query, function(err, hse){
        if(err) throw err;
        if(!hse){
            return done(null, false);
        }
        bcrypt.compare(password, hse.password, function(err, isMatch){
            if(err) throw err;
            if(isMatch)
                return done(null, hse);
            else
                return done(null,false);
        });
    });
}));


//authentication serialize, deserialize

passport.serializeUser(function (entity, done) {
    done(null, { id: entity.id, username: entity.username });
});

passport.deserializeUser(function (obj, done) {
    if(obj.username==process.env.hseUSERNAME) {
        HSE.findById(obj.id)
            .then(device => {
                if (device) {
                    done(null, device);
                } else {
                    done(new Error('hse id not found:' + obj.id, null));
                }
            });
    }else{
        Patient.findById(obj.id)
        .then(user => {
            if (user) {
                done(null, user);
            }
            else {
                done(new Error('user id not found:' + obj.id, null));
            }
        });
    }
});


// register hse details manually

HSE.find({"username" : process.env.hseUSERNAME},function(err, hses){
    if(err){
        console.log(err);
    }else{
        if(hses.length==0){
            var newHSE = new HSE({
                username: process.env.hseUSERNAME,
                password: process.env.hsePASSWORD
            });
        
            bcrypt.genSalt(10, function(err,  salt){
                bcrypt.hash(newHSE.password, salt, function(err, hash){
                    if(!err){
                        newHSE.password = hash;
                    }
                    newHSE.save(function(err){
                        if(err){
                            console.log(err.message);
                        }
                    });
                });
            });
        }
    }
});


// function to detect date change and hence set token to 1

function decideDate(){
    curr_date = new Date();
    DecisionDate.findOne({},function(err, foundDate){
        if(foundDate==null){
            DecisionDate.create({decisionDate: Date.now(), token: 1, apt_token: 1},function(err, date){});
        }else if(curr_date.getDate()-foundDate.decisionDate.getDate() != 0){
            foundDate.decisionDate= Date.now();
            foundDate.token=1;
            foundDate.apt_token=1;
            foundDate.save(function(err){});
        }
    });
}

setInterval(decideDate, 1000);


// function to remove appointment if patient is late

function removeAppointment(){
    curr_date = new Date();
    Appointment.find({}, function(err, foundAppointments){
        if(err){
            console.log(err);
        }else if(foundAppointments.length != 0){
            foundAppointments.forEach(function(apt){
                if(curr_date.getTime() - apt.date.getTime() > 30*60*1000){
                    RegPatient.findOne({"pid": apt.pid, "stage1.isGone": false, "stage1.isInQueue": true}, function(err, foundPatient){
                        if(foundPatient!=null){
                            foundPatient.stage1.isInQueue = false;
                            foundPatient.save(function(err){});
                        }
                    });
                    Appointment.deleteOne({"_id": apt._id}, function(err){
                        if(err){
                            console.log(err);
                        }
                    });
                }
            });
        }
    });
}

setInterval(removeAppointment, 60000);



// set variables such that they can access by all files

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


// set functionally on each respective route

app.use("/patient", patientRoutes);
app.use("/HSE", hseRoutes);
app.use("/", indexRoutes);


// start server

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app).listen(process.env.PORT || 1000, function () {
    console.log('Server Started and it is listening on port 1000! Go to https://localhost:1000/');
});