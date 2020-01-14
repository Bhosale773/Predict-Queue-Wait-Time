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
var HSE                   = require("./models/hse");
var Patient               = require("./models/patient");
var RegPatient            = require("./models/regPatient");
var DecisionDate          = require("./models/date");
var token_no;
var curr_date;
// var regPatientsList = [];
// var consultationQueue = [];
// var billingQueue = [];
// var medicineQueue = [];


// var d = new Date();
// console.log(d);

// var d1 = d.getDate(); 
// var d2 = d.getMonth();
// var d3 = d.getFullYear();
// var d4 = d.getDay();
// var d5 = d.getHours();
// var d6 = d.getMinutes();
// var d7 = d.getSeconds();
// var d8 = d.getMilliseconds();

// console.log(d1+" "+d2+" "+d3+" "+d4+" "+d5+" "+d6+" "+d7+" "+d8);

// console.log(d.toString());


// database connection url

mongoose.set('useCreateIndex', true);
mongoose.connect("mongodb://localhost:27017/pqt_db",{useNewUrlParser:true, useUnifiedTopology: true});
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

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


//strategies

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


//serialize, deserialize

passport.serializeUser(function (entity, done) {
    done(null, { id: entity.id, username: entity.username });
});

passport.deserializeUser(function (obj, done) {
    if(obj.username=='hse') {
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


// routes

app.get("/",function(req, res){
    res.render("landing");
});

app.get("/login", isLoginPermitted, function(req, res){
    res.render("login");
});

app.get("/patient/dashboard", isPatientPermitted, function(req, res){
    if(req.user){
        RegPatient.findOne({"pid": req.user._id, "stage1.isInQueue": true}, function(err, foundHistory){
            res.render("patient/dashboard", {currentUserStatus: foundHistory});
        });
    }else{
        res.render("patient/dashboard", {currentUserStatus: null});
    }
});

app.get("/patient/profile", isPatientPermitted, function(req, res){
    res.render("patient/profile");
});

app.get("/patient/qr-code", isPatientPermitted, function(req, res){
    res.render("patient/qr-code");
});

app.get("/patient/history", isPatientPermitted, function(req, res){
    if(req.user){
        RegPatient.find({"pid": req.user._id}, function(err, foundHistory){
            res.render("patient/history", {foundHistory: foundHistory});
        });
    }else{
        res.render("patient/history", {foundHistory: []});
    }
});

app.get("/HSE/home", isHsePermitted, function(req, res){
    regPatientsList = [];
    consultationQueue = [];
    billingQueue = [];
    medicineQueue = [];

    RegPatient.find({}, function(err, foundPatients){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.");
            return res.redirect("back");
        }else{
            res.render("HSE/home", {regPatients: foundPatients});
        }



        //     if(foundPatients.length!=0){
        //         foundPatients.forEach(function(patient1){
        //             Patient.findById(patient1.pid, function(err, patient2){
        //                 if(err){
        //                     console.log(err);
        //                 }else{
        //                     regPatientsList.push(patient2);
        //                     if(patient1.stage1.isGone == true){
        //                         consultationQueue.push(patient2);
        //                     }
        //                     if(patient1.stage2.outTime.isGone == true){
        //                         consultationQueue.splice(consultationQueue.indexOf(patient2), 1);
        //                         billingQueue.push(patient2);
        //                     }
        //                     if(patient1.stage3.isGone == true){
        //                         billingQueue.splice(billingQueue.indexOf(patient2), 1);
        //                         medicineQueue.push(patient2);
        //                     }
        //                     if(patient1.stage1.isGone == false){
        //                         if(medicineQueue.indexOf(patient2)>-1){
        //                             medicineQueue.splice(medicineQueue.indexOf(patient2), 1);
        //                         }
        //                     }
        //                 }
        //             });
        //         });
        //     }
        
        // console.log(regPatientsList);
        // console.log(consultationQueue);
        // console.log(billingQueue);
        // console.log(medicineQueue);
    });
});

app.get("/HSE/patient-list", isHsePermitted, function(req, res){
    RegPatient.find({}, function(err, foundPatients){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.");
            return res.redirect("back");
        }else{
            res.render("HSE/patient-list", {regPatients: foundPatients});
        }
    });
});

HSE.find({"username" : "hse"},function(err, hses){
    if(err){
        console.log(err);
    }else{
        if(hses.length==0){
            var newHSE = new HSE({
                username: "hse",
                password: "hse"
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

app.post("/register", function(req, res){
    if(req.body.username=="hse"){
        req.flash("error", "Username Already Exists, Try Again");
        return res.redirect("/");
    }else{
        Patient.find({"username": req.body.username},function(err, patients){
            if(err){
                req.flash("error", "Something Went Wrong, Try Again");
                return res.redirect("/");
            }
            if(patients.length!=0){
                req.flash("error", "Username Already Exists, Try Again");
                return res.redirect("/");
            }else{
                var newPatient = new Patient({
                    fname: req.body.fname,
                    lname: req.body.lname,
                    age: req.body.age,
                    gender: req.body.gender,
                    contact: req.body.contact,
                    email: req.body.email,
                    address: req.body.address,
                    username: req.body.username,
                    password: req.body.password
                });
            
                bcrypt.genSalt(10, function(err,  salt){
                    bcrypt.hash(newPatient.password, salt, function(err, hash){
                        if(!err){
                            newPatient.password = hash;
                        }
                        newPatient.save(function(err){
                            if(err){
                                req.flash("error", "Something Went Wrong, Try Again");
                                return res.redirect("/");
                            }
                            if(req.user){
                                req.flash("success", "Another account created successfully");
                                return res.redirect("/");
                            }else{
                                req.flash("success", "Account created successfully, Proceed with login");
                                return res.redirect("/login");
                            }
                        });
                    });
                });
            }
        });
    }
});

app.post("/patient/login",passport.authenticate("patient", {
    successRedirect: "/patient/dashboard",
    failureRedirect: "/login",
    successFlash: "You have Sign In successfully.",
    failureFlash: "Invalid username or password."
}) ,function(req,res){
});

app.post("/HSE/login",passport.authenticate("hse", {
    successRedirect: "/HSE/home",
    failureRedirect: "/login",
    successFlash: "You have Sign In successfully.",
    failureFlash: "Invalid username or password."
}) ,function(req,res){
});

app.get("/logout", isLogoutPermitted, function(req, res){
    if(req.user){
        req.logout();
        req.flash("success", "You have Log Out Successfully.");
    }
    return res.redirect("/");
});

app.post("/HSE/patient-registration", function(req, res){
    Patient.findById(req.body.pid, function(err, patient){
        if(err){
            req.flash("error", "Invalid Patient Id, Try Again");
            return res.redirect("back");
        }else{
            if(patient==null){
                req.flash("error", "Invalid Patient Id, Try Again");
                return res.redirect("back");
            }else{
                if(req.body.stage==1){
                    RegPatient.find({"pid": patient._id, "stage1.isGone": true},function(err, foundPatients){
                        if(err){
                            req.flash("error", "Something Went Wrong, Try Again.");
                            return res.redirect("back");
                        }else{
                            if(foundPatients.length==0){
                                RegPatient.create({
                                    pid: patient._id,
                                    name: patient.fname + " " + patient.lname,
                                    token: token_no,
                                    stage1: {
                                        isInQueue: true,
                                        date: Date.now(),
                                        isGone: true
                                    }
                                },function(err, regPatient){
                                    if(err){
                                        req.flash("error", "Something Went Wrong, Try Again.");
                                        return res.redirect("back");
                                    }else{
                                        token_no++;
                                        DecisionDate.findOne({},function(err, foundDate){
                                            foundDate.token=token_no;
                                            foundDate.decisionDate = Date.now();
                                            foundDate.save(function(err){});
                                        });
                                        return res.redirect("/HSE/home");
                                    }
                                });
                            }else{
                                req.flash("error", "Patient already gone through this stage, Try Again");
                                return res.redirect("back");
                            }
                        }
                    });                
                }else if(req.body.stage==2){
                    RegPatient.findOne({"pid": patient._id, "stage1.isGone": true}, function(err, foundPatient){
                        if(err){
                            req.flash("error", "Something Went Wrong, Try Again.");
                            return res.redirect("back");
                        }else{
                            if(foundPatient==null){
                                req.flash("error", "You cant jump directly to this stage, Try Again.");
                                return res.redirect("back");
                            }else if(foundPatient.stage2.inTime.isGone==false){
                                RegPatient.countDocuments({"stage2.isActive": true},function(err, count){
                                    RegPatient.findOne({"stage1.isGone": true, "stage2.inTime.isGone": false}).sort({ _id: 1 }).exec(function(err, oldestPatient){
                                        if(oldestPatient!=null){
                                            // console.log(oldestPatient._id);
                                            // console.log(foundPatient._id);
                                            // console.log(count);
                                            // console.log(count==0);
                                            // console.log(oldestPatient._id.equals(foundPatient._id));
                                            if(count==0 && oldestPatient._id.equals(foundPatient._id)){ 
                                                foundPatient.stage2.isActive=true;
                                                foundPatient.stage2.inTime.isGone=true;
                                                foundPatient.stage2.inTime.date=Date.now();
                                                foundPatient.save(function(err){
                                                    if(err){
                                                        console.log(err);
                                                    }
                                                    return res.redirect("/HSE/home");
                                                });
                                            }else{
                                                req.flash("error", "There is patient ahead.");
                                                return res.redirect("back");
                                            }      
                                        }
                                    });
                                                           
                                });
                            }else if(foundPatient.stage2.outTime.isGone==false){
                                if(foundPatient.stage2.isActive==true){
                                    foundPatient.stage2.isActive=false;
                                    foundPatient.stage2.outTime.isGone=true;
                                    foundPatient.stage2.outTime.date=Date.now();

                                    RegPatient.countDocuments({"stage2.outTime.isGone": true, "stage3.isGone": false},function(err, count){
                                        if(count==0){
                                            foundPatient.stage3.isActive=true;
                                        }      
                                        foundPatient.save(function(err){
                                            if(err){
                                                console.log(err);
                                            }
                                            return res.redirect("/HSE/home");                         
                                        });
                                    });
                                }else{
                                    req.flash("error", "There is patient ahead.");
                                    return res.redirect("back");
                                }
                            }else{
                                req.flash("error", "Patient already gone through this stage, Try Again");
                                return res.redirect("back");
                            }
                        }
                    });
                }else if(req.body.stage==3){
                    RegPatient.findOne({"pid": patient._id, "stage2.outTime.isGone": true}, function(err, foundPatient){
                        if(err){
                            req.flash("error", "Something Went Wrong, Try Again.");
                            return res.redirect("back");
                        }else{
                            if(foundPatient==null){
                                req.flash("error", "You cant jump directly to this stage, Try Again.");
                                return res.redirect("back");
                            }else if(foundPatient.stage3.isGone==false){
                                if(foundPatient.stage3.isActive==true){

                                    foundPatient.stage3.isActive=false;
                                    foundPatient.stage3.isGone=true;
                                    foundPatient.stage3.date=Date.now();
    
                                    RegPatient.countDocuments({"stage3.isGone": true, "stage4.isGone": false},function(err, count){
                                        if(count==0){
                                            foundPatient.stage4.isActive=true;
                                        }      
                                        foundPatient.save(function(err){
                                            if(err){
                                                console.log(err);
                                            }
                                            RegPatient.findOne({"stage2.outTime.isGone": true, "stage3.isGone": false}).sort({ _id: 1 }).exec(function(err, oldestPatient){
                                                if(oldestPatient!=null){
                                                    oldestPatient.stage3.isActive=true;
                                                    oldestPatient.save(function(err){
                                                        if(err){
                                                            console.log(err);
                                                        }
                                                    });
                                                }
                                                return res.redirect("/HSE/home");
                                            });
                                        });
                                    });
    
                                }else{
                                    req.flash("error", "There is patient ahead.");
                                    return res.redirect("back");
                                }
                            }else{
                                req.flash("error", "Patient already gone through this stage, Try Again");
                                return res.redirect("back");
                            }
                        }
                    });
                }else if(req.body.stage==4){
                    RegPatient.findOne({"pid": patient._id, "stage3.isGone": true}, function(err, foundPatient){
                        if(err){
                            req.flash("error", "Something Went Wrong, Try Again.");
                            return res.redirect("back");
                        }else{
                            if(foundPatient==null){
                                req.flash("error", "You cant jump directly to this stage, Try Again.");
                                return res.redirect("back");
                            }else if(foundPatient.stage4.isGone==false){
                                if(foundPatient.stage4.isActive==true){

                                    foundPatient.stage4.date=Date.now();
                                    foundPatient.stage4.isActive=false;
                                    foundPatient.stage1.isInQueue=false;
                                    foundPatient.stage1.isGone=false;
                                    foundPatient.stage2.inTime.isGone=false;
                                    foundPatient.stage2.outTime.isGone=false;
                                    foundPatient.stage3.isGone=false;
                                    foundPatient.save(function(err){
                                        if(err){
                                            console.log(err);
                                        }
                                        RegPatient.findOne({"stage3.isGone": true, "stage4.isGone": false}).sort({ _id: 1 }).exec(function(err, oldestPatient){
                                            if(oldestPatient!=null){
                                                oldestPatient.stage4.isActive=true;
                                                oldestPatient.save(function(err){
                                                    if(err){
                                                        console.log(err);
                                                    }
                                                });
                                            }
                                            return res.redirect("/HSE/home");
                                        });
                                    });
                                }else{
                                    req.flash("error", "There is patient ahead.");
                                    return res.redirect("back");
                                }
                            }
                        }
                    });
                }
            }
        }
    });
});

app.post("/HSE/remove-patient-from-queue", function(req, res){
    RegPatient.findOne({"_id":req.body.pid, "stage1.isInQueue":true}, function(err, patient){
        
        if(patient.stage3.isActive==true){
            patient.stage1.isInQueue=false;
            patient.stage1.isGone=false;
            patient.stage2.isActive=false;
            patient.stage2.inTime.isGone=false;
            patient.stage2.outTime.isGone=false;
            patient.stage3.isActive=false;
            patient.stage3.isGone=false;
            patient.stage4.isActive=false;
            patient.stage4.isGone=false;
            patient.save(function(err){
                if(err){
                    console.log(err);
                }
                RegPatient.findOne({"stage2.outTime.isGone": true, "stage3.isGone": false}).sort({ _id: 1 }).exec(function(err, oldestPatient){
                    if(oldestPatient!=null){
                        oldestPatient.stage3.isActive=true;
                        oldestPatient.save(function(err){
                            if(err){
                                console.log(err);
                            }
                        });
                    }
                    res.redirect("/HSE/home");
                });
            });
        }else if(patient.stage4.isActive==true){
            patient.stage1.isInQueue=false;
            patient.stage1.isGone=false;
            patient.stage2.isActive=false;
            patient.stage2.inTime.isGone=false;
            patient.stage2.outTime.isGone=false;
            patient.stage3.isActive=false;
            patient.stage3.isGone=false;
            patient.stage4.isActive=false;
            patient.stage4.isGone=false;
            patient.save(function(err){
                if(err){
                    console.log(err);
                }
                RegPatient.findOne({"stage3.isGone": true, "stage4.isGone": false}).sort({ _id: 1 }).exec(function(err, oldestPatient){
                    if(oldestPatient!=null){
                        oldestPatient.stage4.isActive=true;
                        oldestPatient.save(function(err){
                            if(err){
                                console.log(err);
                            }
                            
                        });
                    }
                    res.redirect("/HSE/home");
                });
            });
        }else{
            patient.stage1.isInQueue=false;
            patient.stage1.isGone=false;
            patient.stage2.isActive=false;
            patient.stage2.inTime.isGone=false;
            patient.stage2.outTime.isGone=false;
            patient.stage3.isActive=false;
            patient.stage3.isGone=false;
            patient.stage4.isActive=false;
            patient.stage4.isGone=false;
            patient.save(function(err){
                if(err){
                    console.log(err);
                }
                res.redirect("/HSE/home");
            });
        }

    });
});

app.get("*",function(req,res){
    res.send("Invalid url : Page Not Found");
});


// Middlewares

function isHsePermitted(req, res, next){
    if(req.isAuthenticated()){
        if(req.user.username=="hse"){
            return next();
        }else{
            req.flash("error", "You dont have permission to do that");
            return res.redirect("back");
        }
    }else{
        req.flash("error", "You must be Sign In first.");
        return res.redirect("/login");
    }
}

function isPatientPermitted(req, res, next){
    if(req.isAuthenticated()){
        if(req.user.username!="hse"){
            return next();
        }else{
            req.flash("error", "You dont have permission to do that");
            return res.redirect("back");
        }
    }else{
        req.flash("error", "You must be Sign In first.");
        return res.redirect("/login");
    }
}

function isLoginPermitted(req, res, next){
    if(!req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You are already login");
    return res.redirect("back");
}

function isLogoutPermitted(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You are already log out");
    return res.redirect("back");
}


// function to detect date change and hence set token to 1

function decideDate(){
    curr_date = new Date();
    DecisionDate.findOne({},function(err, foundDate){
        if(foundDate==null){
            token_no=1;
            DecisionDate.create({decisionDate: Date.now(), token: 1},function(err, date){});
        }else if(curr_date.getDate()-foundDate.decisionDate.getDate() != 0){
            token_no=1;
            foundDate.decisionDate= Date.now();
            foundDate.token=1;
            foundDate.save(function(err){});
        }else{
            token_no = foundDate.token;
        }
    });
}

setInterval(decideDate, 1000);


// function to create queue arrays

// function createQueues(){
//     regPatientsList = [];
//     consultationQueue = [];
//     billingQueue = [];
//     medicineQueue = [];

//     RegPatient.find({}, function(err, foundPatients){
//         if(err){
//             console.log(err);
//         }else{
//             if(foundPatients.length!=0){
//                 foundPatients.forEach(function(patient1){
//                     Patient.findById(patient1.pid, function(err, patient2){
//                         if(err){
//                             console.log(err);
//                         }else{
//                             regPatientsList.push(patient2);
//                             if(patient1.stage1.isGone == true){
//                                 consultationQueue.push(patient2);
//                             }
//                             if(patient1.stage2.outTime.isGone == true){
//                                 consultationQueue.splice(consultationQueue.indexOf(patient2), 1);
//                                 billingQueue.push(patient2);
//                             }
//                             if(patient1.stage3.isGone == true){
//                                 billingQueue.splice(billingQueue.indexOf(patient2), 1);
//                                 medicineQueue.push(patient2);
//                             }
//                             if(patient1.stage1.isGone == false){
//                                 if(medicineQueue.indexOf(patient2)>-1){
//                                     medicineQueue.splice(medicineQueue.indexOf(patient2), 1);
//                                 }
//                             }
//                         }
//                     });
//                 });
//             }
//         }
//     });
// }

// setInterval(createQueues, 10);



https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app).listen(process.env.PORT || 1000, function () {
    console.log('Server Started and it is listening on port 1000! Go to https://localhost:1000/')
})