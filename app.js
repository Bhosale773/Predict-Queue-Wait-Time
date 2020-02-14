// importing packages

var express               = require("express");
var app                   = express();
var fs                    = require('fs')
var path                  = require('path');
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
var TimeSpanData          = require("./models/timeSpanData");
var AlgoData              = require("./models/algoData");


// importing svm models

var model0                = require("./svmModels/model0");  // consultation stage - reason0
var model1                = require("./svmModels/model1");  // consultation stage - reason1
var model2                = require("./svmModels/model2");  // consultation stage - reason2
var model3                = require("./svmModels/model3");  // consultation stage - reason3
var model4                = require("./svmModels/model4");  // consultation stage - reason4
var model5                = require("./svmModels/model5");  // billing stage
var model6                = require("./svmModels/model6");  // medicine stage


// importing routes

var indexRoutes           = require("./routes/index");
var patientRoutes         = require("./routes/patients");
var hseRoutes             = require("./routes/hses");


// declare variables

var curr_date;


// database connection url

mongoose.set('useCreateIndex', true);
// mongoose.connect("mongodb://localhost:27017/pqt_db",{useNewUrlParser:true, useUnifiedTopology: true});
mongoose.connect(process.env.DATABASEURL, {useNewUrlParser:true, useUnifiedTopology: true});
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


// initialize algodata details

AlgoData.find({},function(err, algoDatas){
    if(err){
        console.log(err);
    }else{
        if(algoDatas.length==0){
            AlgoData.create({key : 1},function(err,f){});
        }
    }
});


// read data from training data file

let data = fs.readFileSync(
    path.join(__dirname, './dataset/training-data.txt'),
    'utf-8'
);

data = data.split('\n').map((line) => line.split(' ').filter((el) => el));

var data0=[];
var data1=[];
var data2=[];
var data3=[];
var data4=[];
var data5=[];
var data6=[];

data.forEach(function(d){
    if(d[3]=='3:0.2' && d[4]=='4:0.0\r'){
        data0.push(d);
    }
    if(d[3]=='3:0.2' && d[4]=='4:0.1\r'){
        data1.push(d);
    }
    if(d[3]=='3:0.2' && d[4]=='4:0.2\r'){
        data2.push(d);
    }
    if(d[3]=='3:0.2' && d[4]=='4:0.3\r'){
        data3.push(d);
    }
    if(d[3]=='3:0.2' && d[4]=='4:0.4\r'){
        data4.push(d);
    }
    if(d[3]=='3:0.3'){
        data5.push(d);
    }
    if(d[3]=='3:0.4'){
        data6.push(d);
    }
});

var labels0 = data0.map((line) => +line.splice(0, 1)[0]);
var features0 = data0.map((line) => line.map((el) => +el.split(':')[1]));
var labels1 = data1.map((line) => +line.splice(0, 1)[0]);
var features1 = data1.map((line) => line.map((el) => +el.split(':')[1]));
var labels2 = data2.map((line) => +line.splice(0, 1)[0]);
var features2 = data2.map((line) => line.map((el) => +el.split(':')[1]));
var labels3 = data3.map((line) => +line.splice(0, 1)[0]);
var features3 = data3.map((line) => line.map((el) => +el.split(':')[1]));
var labels4 = data4.map((line) => +line.splice(0, 1)[0]);
var features4 = data4.map((line) => line.map((el) => +el.split(':')[1]));
var labels5 = data5.map((line) => +line.splice(0, 1)[0]);
var features5 = data5.map((line) => line.map((el) => +el.split(':')[1]));
var labels6 = data6.map((line) => +line.splice(0, 1)[0]);
var features6 = data6.map((line) => line.map((el) => +el.split(':')[1]));


// train the models with respective data

if(features0.length!=0 && labels0.length!=0){
    model0.train(features0, labels0);
}
if(features1.length!=0 && labels1.length!=0){
    model1.train(features1, labels1);
}
if(features2.length!=0 && labels2.length!=0){
    model2.train(features2, labels2);
}
if(features3.length!=0 && labels3.length!=0){
    model3.train(features3, labels3);
}
if(features4.length!=0 && labels4.length!=0){
    model4.train(features4, labels4);
}
if(features5.length!=0 && labels5.length!=0){
    model5.train(features5, labels5);
}
if(features6.length!=0 && labels6.length!=0){
    model6.train(features6, labels6);
}











app.get("/data-analysis", function(req, res){
    
    let tdata = fs.readFileSync(
        path.join(__dirname, './dataset/testing-data.txt'),
        'utf-8'
    );
    
    tdata = tdata.split('\n').map((line) => line.split(' ').filter((el) => el));
    
    var tdata0=[];
    var tdata1=[];
    var tdata2=[];
    var tdata3=[];
    var tdata4=[];
    var tdata5=[];
    var tdata6=[];
    
    
    tdata.forEach(function(d){
        if(d[3]=='3:0.2' && d[4]=='4:0.0\r'){
            tdata0.push(d);
        }
        if(d[3]=='3:0.2' && d[4]=='4:0.1\r'){
            tdata1.push(d);
        }
        if(d[3]=='3:0.2' && d[4]=='4:0.2\r'){
            tdata2.push(d);
        }
        if(d[3]=='3:0.2' && d[4]=='4:0.3\r'){
            tdata3.push(d);
        }
        if(d[3]=='3:0.2' && d[4]=='4:0.4\r'){
            tdata4.push(d);
        }
        if(d[3]=='3:0.3'){
            tdata5.push(d);
        }
        if(d[3]=='3:0.4'){
            tdata6.push(d);
        }
    });
    
    
    var tlabels0 = tdata0.map((line) => +line.splice(0, 1)[0]);
    var tfeatures0 = tdata0.map((line) => line.map((el) => +el.split(':')[1]));
    var tlabels1 = tdata1.map((line) => +line.splice(0, 1)[0]);
    var tfeatures1 = tdata1.map((line) => line.map((el) => +el.split(':')[1]));
    var tlabels2 = tdata2.map((line) => +line.splice(0, 1)[0]);
    var tfeatures2 = tdata2.map((line) => line.map((el) => +el.split(':')[1]));
    var tlabels3 = tdata3.map((line) => +line.splice(0, 1)[0]);
    var tfeatures3 = tdata3.map((line) => line.map((el) => +el.split(':')[1]));
    var tlabels4 = tdata4.map((line) => +line.splice(0, 1)[0]);
    var tfeatures4 = tdata4.map((line) => line.map((el) => +el.split(':')[1]));
    var tlabels5 = tdata5.map((line) => +line.splice(0, 1)[0]);
    var tfeatures5 = tdata5.map((line) => line.map((el) => +el.split(':')[1]));
    var tlabels6 = tdata6.map((line) => +line.splice(0, 1)[0]);
    var tfeatures6 = tdata6.map((line) => line.map((el) => +el.split(':')[1]));
    
    var output1=[];
    output1.push(model0.predict(tfeatures0));
    output1.push(model1.predict(tfeatures1));
    output1.push(model2.predict(tfeatures2));
    output1.push(model3.predict(tfeatures3));
    output1.push(model4.predict(tfeatures4));
    output1.push(model5.predict(tfeatures5));
    output1.push(model6.predict(tfeatures6));
    
    var output2=[];
    output2.push(tlabels0);
    output2.push(tlabels1);
    output2.push(tlabels2);
    output2.push(tlabels3);
    output2.push(tlabels4);
    output2.push(tlabels5);
    output2.push(tlabels6);

    res.render("data-analysis.ejs",{predict: output1, expect: output2});
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

// app.listen(process.env.PORT || 1000, function (){
//     console.log('Server Started and it is listening on port 1000! Go to https://localhost:1000/');
// });






//calculate the algorithm
// function updateAlgoData(){
//     TimeSpanData.find({type: 0, consultTime : {$ne : null}},function(err,found){
//         var count = 0;
//         var sum = 0;
//         if(found.length!=0){
//             found.forEach(thisOne => {
//                 sum = sum + thisOne.consultTime;
//                 count++;
//             });
//             AlgoData.findOne({},function(err,myData){
//                 myData.consultAvg[0]=sum/count;
//                 myData.save(function(err){});
//                 console.log(sum,myData.consultAvg);
//             });
//         }
//     });

//     TimeSpanData.find({type: 1, consultTime : {$ne : null}},function(err,found){
//         var count = 0;
//         var sum = 0;
//         if(found.length!=0){
//             found.forEach(thisOne => {
//                 sum = sum + thisOne.consultTime;
//                 count++;
//             });
//             AlgoData.findOne({},function(err,myData){
//                 myData.consultAvg[1]=sum/count;
//                 myData.save(function(err){});
//                 console.log(sum,myData.consultAvg);
//             });
//         }
//     });

//     TimeSpanData.find({type: 2, consultTime : {$ne : null}},function(err,found){
//         var count = 0;
//         var sum = 0;
//         if(found.length!=0){
//             found.forEach(thisOne => {
//                 sum = sum + thisOne.consultTime;
//                 count++;
//             });
//             AlgoData.findOne({},function(err,myData){
//                 myData.consultAvg[2]=sum/count;
//                 myData.save(function(err){});
//                 console.log(sum,myData.consultAvg);
//             });
//         }
//     });

//     TimeSpanData.find({type: 3, consultTime : {$ne : null}},function(err,found){
//         var count = 0;
//         var sum = 0;
//         if(found.length!=0){
//             found.forEach(thisOne => {
//                 sum = sum + thisOne.consultTime;
//                 count++;
//             });
//             AlgoData.findOne({},function(err,myData){
//                 console.log("hello");
//                 myData.consultAvg[3]=sum/count;
//                 myData.save(function(err){});
//                 console.log(sum,myData.consultAvg);
//             });
//         }
//     });

//     TimeSpanData.find({type: 4, consultTime : {$ne : null}},function(err,found){
//         var count = 0;
//         var sum = 0;
//         if(found.length!=0){
//             found.forEach(thisOne => {
//                 sum = sum + thisOne.consultTime;
//                 count++;
//             });
//             AlgoData.findOne({},function(err,myData){
//                 myData.consultAvg[4]=sum/count;
//                 myData.save(function(err){});
//                 console.log(sum,myData.consultAvg);
//             });
//         }
//     });

//     TimeSpanData.find({billTime : {$ne : null}},function(err,found){
//         var count = 0;
//         var sum = 0;
//         if(found.length!=0){
//             found.forEach(thisOne => {
//                 sum = sum + thisOne.billTime;
//                 count++;
//             });
//             AlgoData.findOne({},function(err,myData){
//                 myData.billAvg=sum/count;
//                 myData.save(function(err){});
//             });
//         }
//     });

//     TimeSpanData.find({mediTime : {$ne : null}},function(err,found){
//         var count = 0;
//         var sum = 0;
//         if(found.length!=0){
//             found.forEach(thisOne => {
//                 sum = sum + thisOne.mediTime;
//                 count++;
//             });
//             AlgoData.findOne({},function(err,myData){
//                 myData.mediAvg=sum/count;
//                 myData.save(function(err){});
//             });
//         }
//     });
// }
//this is currently commmented because we donot have right data
//setInterval(updateAlgoData,20000);
