var express               = require("express");
var router                = express.Router();
var timespan              = require("timespan");
var passport              = require("passport");
var middleware            = require("../middleware");
var Patient               = require("../models/patient");
var RegPatient            = require("../models/regPatient");
var DecisionDate          = require("../models/date");
var Appointment           = require("../models/appointment");
var TimeSpanData          = require("../models/timeSpanData");
var AlgoData              = require("../models/algoData");
var model0                = require("../svmModels/model0");
var model1                = require("../svmModels/model1");
var model2                = require("../svmModels/model2");
var model3                = require("../svmModels/model3");
var model4                = require("../svmModels/model4");
var model5                = require("../svmModels/model5");
var model6                = require("../svmModels/model6");
var calculate             = require("../calculations");
var token_no;
var dotenv                = require("dotenv");

dotenv.config();

// route to login hse

router.post("/login",passport.authenticate("hse", {
    successRedirect: "/HSE/home",
    failureRedirect: "/login",
    successFlash: "You have Sign In successfully.",
    failureFlash: "Invalid username or password."
}) ,function(req,res){
});


// route to hse home

router.get("/home", middleware.isHsePermitted, function(req, res){
    RegPatient.find({}, function(err, foundPatients){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.");
            return res.redirect("back");
        }else{
            res.render("HSE/home", {regPatients: foundPatients});
        }
    });
});


// route to form for booking apointments

router.get("/book-appointments", middleware.isHsePermitted, function(req, res){
    var data = calculate(null, null);
    Appointment.find({}, function(err, foundAppointments){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.");
            return res.redirect("back");
        }else{
            setTimeout(function(){
                res.render("HSE/appointments", {appointments: foundAppointments, data: data});
            },1000); 
        }
    });
});


// route to retrive and show all patient data from database

router.get("/patient-list", middleware.isHsePermitted, function(req, res){
    var p_date = new Date();
    var p_dateD = (p_date.getDate() < 10)?'0'+p_date.getDate():p_date.getDate();
    var p_dateM = ((p_date.getMonth()+1) < 10)?'0'+(p_date.getMonth()+1):(p_date.getMonth()+1);
    var p_dateY = p_date.getFullYear();
    var p_dateFull = p_dateY + "-" + p_dateM + "-" + p_dateD;
    
    RegPatient.find({"stage1.isInQueue": false}, function(err, foundPatients){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.");
            return res.redirect("back");
        }else{
            res.render("HSE/patient-list", {regPatients: foundPatients, date: p_dateFull});
        }
    });
});


// route to view paients details

router.get("/:id", middleware.isHsePermitted, function(req, res){
    RegPatient.findById(req.params.id, function(err, foundRegPatient){
        Patient.findById(foundRegPatient.pid, function(err, foundPatient){
            res.render("HSE/patient-details",{patient: foundPatient, regPatient: foundRegPatient});
        });
    });
});




// filter patient data according to date from database

router.post("/filter-patient-list", middleware.isHsePermitted, function(req, res){
    RegPatient.find({"stage1.isInQueue": false}, function(err, foundPatients){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.");
            return res.redirect("back");
        }else{
            res.render("HSE/patient-list", {regPatients: foundPatients, date: req.body.date});
        }
    });
});

// route to register patient by hse

router.post("/patient-registration", function(req, res){
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
                                Appointment.findOne({"pid":req.body.pid}, function(err, foundAppointment){
                                    if(req.body.pid==process.env.EMERGENCY){
                                        RegPatient.findOne({"pid":req.body.pid,"stage1.isInQueue":true},function(err,emergency){
                                            emergency.stage1.date=Date.now();
                                            emergency.stage1.isGone=true;
                                            emergency.save(function(err){});
                                            return res.redirect("/HSE/home");
                                        })
                                    }
                                    else if(foundAppointment!=null){
                                        RegPatient.findOne({"pid": patient._id, "stage1.isInQueue": true}, function(err, foundPatient){
                                            if(foundPatient==null){
                                                req.flash("error", "Appointment does not exist");
                                                return res.redirect("back");
                                            }else{
                                                foundPatient.stage1.date=Date.now();
                                                foundPatient.stage1.isGone=true;
                                                Appointment.findOne({"pid": patient._id}, function(err, foundAppointment){
                                                    if(foundAppointment!=null){
                                                        Appointment.deleteOne({"_id": foundAppointment._id}, function(err){
                                                            if(err){
                                                                console.log(err);
                                                            }
                                                        });
                                                    }
                                                });
                                                foundPatient.save(function(err){
                                                    if(err){
                                                        console.log(err);
                                                    }
                                                    RegPatient.countDocuments({"stage1.isInQueue" : true, "stage2.outTime.isGone" : false, "stage1.date" : {$ne : null}}, function(err,count){
                                                        AlgoData.findOne({},function(err, foundData){
                                                            if(foundData!=null){
                                                                var date = new Date();
                                                                var day = date.getDay();
                                                                var hrs = date.getHours();
                                                                var mins = date.getMinutes();
                                                                var no_of_patients = count;
                                                                var stage = 2;
                                                                if(foundPatient.reason == 0){
                                                                    var reason = 0;
                                                                    foundData.consultAvg.set(0, Math.round(100*model0.predictOne([day, hrs, stage, reason])));
                                                                    foundData.save(function(err){});
                                                                }
                                                                if(foundPatient.reason == 1){
                                                                    var reason = 1;
                                                                    foundData.consultAvg.set(1, Math.round(100*model1.predictOne([day, hrs, stage, reason])));
                                                                    foundData.save(function(err){});
                                                                }
                                                                if(foundPatient.reason == 2){
                                                                    var reason = 2;
                                                                    foundData.consultAvg.set(2, Math.round(100*model2.predictOne([day, hrs, stage, reason])));
                                                                    foundData.save(function(err){});
                                                                }
                                                                if(foundPatient.reason == 3){
                                                                    var reason = 3;
                                                                    foundData.consultAvg.set(3, Math.round(100*model3.predictOne([day, hrs, stage, reason])));
                                                                    foundData.save(function(err){});
                                                                }
                                                                if(foundPatient.reason == 4){
                                                                    var reason = 4;
                                                                    foundData.consultAvg.set(4, Math.round(100*model4.predictOne([day, hrs, stage, reason])));
                                                                    foundData.save(function(err){});
                                                                }
                                                                console.log([day, hrs, mins, no_of_patients, stage, reason]);
                                                            }
                                                            return res.redirect("/HSE/home");
                                                        });
                                                    });
                                                });
                                            }
                                        });
                                    }else{
                                        DecisionDate.findOne({},function(err, foundDate){
                                            RegPatient.create({
                                                pid: patient._id,
                                                name: patient.fname + " " + patient.lname,
                                                token: foundDate.token,
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
                                                    foundDate.token+=1;
                                                    foundDate.decisionDate = Date.now();
                                                    //timespan data inserted..!!
                                                    // TimeSpanData.create({
                                                    //     pid: regPatient._id,
                                                    //     name: patient.fname + " " + patient.lname,
                                                    //     type : regPatient.reason,   
                                                    // },function(err,dataPatient){
                                                    //     if(err){
                                                    //         console.log(err);
                                                    //     }
                                                    // });
                                                    RegPatient.countDocuments({"stage1.isInQueue" : true, "stage2.outTime.isGone" : false, "stage1.date" : {$ne : null}}, function(err,count){
                                                        AlgoData.findOne({},function(err, foundData){
                                                            if(foundData!=null){
                                                                var date = new Date();
                                                                var day = date.getDay();
                                                                var hrs = date.getHours();
                                                                var mins = date.getMinutes();
                                                                var no_of_patients = count;
                                                                var stage = 2;
                                                                if(regPatient.reason == 0){
                                                                    var reason = 0;
                                                                    foundData.consultAvg.set(0, Math.round(100*model0.predictOne([day, hrs, stage, reason])));
                                                                    console.log(foundData.consultAvg[0]+ " " + [day, hrs, mins, no_of_patients, stage, reason]);
                                                                    foundData.save(function(err){
                                                                        if(err){
                                                                            console.log(err);
                                                                        }else{
                                                                            console.log(foundData);
                                                                        }
                                                                    });
                                                                }
                
                                                            }
                                                            foundDate.save(function(err){
                                                                return res.redirect("/HSE/home");
                                                            });
                                                        });
                                                    });
                                                }
                                            });
                                        });
                                    }
                                });
                                
                            }else{
                                req.flash("error", "Patient already gone through this stage, Try Again");
                                return res.redirect("back");
                            }
                        }
                    });                
                }else if(req.body.stage==2){
                    RegPatient.findOne({"pid": patient._id, "stage1.isGone": true},async function(err, foundPatient){
                        if(err){
                            req.flash("error", "Something Went Wrong, Try Again.");
                            return res.redirect("back");
                        }else{
                            if(foundPatient==null){
                                req.flash("error", "You cant jump directly to this stage, Try Again.");
                                return res.redirect("back");
                            }else if(foundPatient.stage2.inTime.isGone==false){
                                RegPatient.countDocuments({"stage2.isActive": true},function(err, count){
                                    RegPatient.findOne({"stage1.isGone": true, "stage2.inTime.isGone": false}).sort({ _id: 1 }).exec(async function(err, oldestPatient){
                                        if(oldestPatient!=null){
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

                                    RegPatient.countDocuments({"stage2.outTime.isGone": true, "stage3.isGone": false}, async function(err, count){
                                        if(count==0){
                                            foundPatient.stage3.isActive=true;
                                            foundPatient.stage3.activeDate=Date.now();
                                        }      
                                        foundPatient.save(function(err){
                                            if(err){
                                                console.log(err);
                                            }
                                            AlgoData.findOne({},function(err, foundData){
                                                if(foundData!=null){
                                                    var date = new Date();
                                                    var day = date.getDay();
                                                    var hrs = date.getHours();
                                                    var mins = date.getMinutes();
                                                    var no_of_patients = count;
                                                    var stage = 3;
                                                    var reason = foundPatient.reason;
                                                    foundData.billAvg = Math.round(100*model5.predictOne([day, hrs, stage, reason]));
                                                    console.log(foundData.billAvg+ " " + [day, hrs, mins, no_of_patients, stage, reason]);
                                                    foundData.save(function(err){});
                                                }
                                                return res.redirect("/HSE/home");                         
                                            });
                                        });
                                        // Promise.all([promise1,promise2])
                                        // .then(function(){
                                        //     TimeSpanData.findOne({pid:foundPatient.pid},function(err,timeData){
                                        //         var ts = timespan.fromDates(foundPatient.stage2.inTime.date,foundPatient.stage2.outTime.date,true);
                                        //         var sec = ts.totalSeconds();
                                        //         timeData.consultTime = sec;
                                        //         timeData.save(function(err){});
                                        //     });
                                        // });
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
                    RegPatient.findOne({"pid": patient._id, "stage2.outTime.isGone": true},function(err, foundPatient){
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
                                            foundPatient.stage4.activeDate=Date.now();
                                        }      
                                        foundPatient.save(function(err){
                                            if(err){
                                                console.log(err);
                                            }
                                            RegPatient.findOne({"stage2.outTime.isGone": true, "stage3.isGone": false}).sort({ _id: 1 }).exec(function(err, oldestPatient){
                                                if(oldestPatient!=null){
                                                    oldestPatient.stage3.isActive=true;
                                                    oldestPatient.stage3.activeDate=Date.now();
                                                    oldestPatient.save(function(err){
                                                        if(err){
                                                            console.log(err);
                                                        }
                                                    });
                                                }
                                                AlgoData.findOne({},function(err, foundData){
                                                    if(foundData!=null){
                                                        var date = new Date();
                                                        var day = date.getDay();
                                                        var hrs = date.getHours();
                                                        var mins = date.getMinutes();
                                                        var no_of_patients = count;
                                                        var stage = 4;
                                                        var reason = foundPatient.reason;
                                                        foundData.mediAvg = Math.round(100*model6.predictOne([day, hrs, stage, reason]));
                                                        console.log(foundData.mediAvg+ " " + [day, hrs, mins, no_of_patients, stage, reason]);
                                                        foundData.save(function(err){});
                                                    }
                                                    return res.redirect("/HSE/home");                         
                                                });
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
                        // Promise.all([promise])
                        // .then(function(){
                        //     TimeSpanData.findOne({pid:foundPatient.pid},function(err,timeData){
                        //         var ts = timespan.fromDates(foundPatient.stage3.date, foundPatient.stage3.activeDate,true);
                        //         var sec = ts.totalSeconds();
                        //         timeData.billTime = sec;
                        //         timeData.save(function(err){});
                        //     });
                        // });
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

                                    Appointment.findOne({"pid": patient._id}, function(err, foundAppointment){
                                        if(foundAppointment!=null){
                                            Appointment.deleteOne({"_id": foundAppointment._id}, function(err){
                                                if(err){
                                                    console.log(err);
                                                }
                                            });
                                        }
                                    });
                                    if(foundPatient.visit_type=="emergency"){
                                        foundPatient.stage1.isInQueue=true;
                                        foundPatient.stage1.date=null;
                                        foundPatient.stage1.isGone=false;
                                        foundPatient.stage2.inTime.date=null;
                                        foundPatient.stage2.inTime.isGone=false;
                                        foundPatient.stage2.outTime.date=null;
                                        foundPatient.stage2.outTime.isGone=false;
                                        foundPatient.stage2.isActive=false;
                                        foundPatient.stage3.isActive=false;
                                        foundPatient.stage3.activeDate=null;
                                        foundPatient.stage3.date=null;
                                        foundPatient.stage4.isActive=false;
                                        foundPatient.stage4.activeDate=null;
                                        foundPatient.stage4.date=null;

                                    }
                                    else{
                                        foundPatient.stage4.date=Date.now();
                                        foundPatient.stage4.isActive=false;
                                        foundPatient.stage1.isInQueue=false;
                                        foundPatient.stage1.isGone=false;
                                        foundPatient.stage2.inTime.isGone=false;
                                        foundPatient.stage2.outTime.isGone=false;
                                        foundPatient.stage3.isGone=false;
                                    }
                                    foundPatient.save(function(err){
                                        if(err){
                                            console.log(err);
                                        }
                                        RegPatient.findOne({"stage3.isGone": true, "stage4.isGone": false}).sort({ _id: 1 }).exec(function(err, oldestPatient){
                                            if(oldestPatient!=null){
                                                oldestPatient.stage4.isActive=true;
                                                oldestPatient.stage4.activeDate=Date.now();
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
                        // Promise.all([promise])
                        // .then(function(){
                        //     TimeSpanData.findOne({pid:foundPatient.pid},function(err,timeData){
                        //         var ts = timespan.fromDates(foundPatient.stage4.activeDate, foundPatient.stage4.date,true);
                        //         var sec = ts.totalSeconds();
                        //         timeData.mediTime = sec;
                        //         timeData.save(function(err){});
                        //     });
                        // });
                    });
                }
            }
        }
    });
});


// route to remove patient from queue

router.post("/remove-patient-from-queue", function(req, res){
    RegPatient.findOne({"_id":req.body.pid, "stage1.isInQueue":true}, function(err, patient){

        Appointment.findOne({"pid": patient.pid}, function(err, foundAppointment){
            if(foundAppointment!=null){
                Appointment.deleteOne({"_id": foundAppointment._id}, function(err){
                    if(err){
                        console.log(err);
                    }
                });
            }
        });

        if(patient.stage3.isActive==true){
            if(patient.visit_type=="emergency"){
                patient.stage1.isInQueue=true;
                patient.stage1.date=null;
                patient.stage1.isGone=false;
                patient.stage2.inTime.date=null;
                patient.stage2.inTime.isGone=false;
                patient.stage2.outTime.date=null;
                patient.stage2.outTime.isGone=false;
                patient.stage2.isActive=false;
                patient.stage3.isActive=false;
                patient.stage3.activeDate=null;
                patient.stage3.date=null;
                patient.stage4.isActive=false;
                patient.stage4.activeDate=null;
                patient.stage4.date=null;
            }
            else{
                patient.stage1.isInQueue=false;
                patient.stage1.isGone=false;
                patient.stage2.isActive=false;
                patient.stage2.inTime.isGone=false;
                patient.stage2.outTime.isGone=false;
                patient.stage3.isActive=false;
                patient.stage3.isGone=false;
                patient.stage4.isActive=false;
                patient.stage4.isGone=false;
            }
            patient.save(function(err){
                if(err){
                    console.log(err);
                }
                RegPatient.findOne({"stage2.outTime.isGone": true, "stage3.isGone": false}).sort({ _id: 1 }).exec(function(err, oldestPatient){
                    if(oldestPatient!=null){
                        oldestPatient.stage3.isActive=true;
                        oldestPatient.stage3.activeDate=Date.now();
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
            if(patient.visit_type=="emergency"){
                patient.stage1.isInQueue=true;
                patient.stage1.date=null;
                patient.stage1.isGone=false;
                patient.stage2.inTime.date=null;
                patient.stage2.inTime.isGone=false;
                patient.stage2.outTime.date=null;
                patient.stage2.outTime.isGone=false;
                patient.stage2.isActive=false;
                patient.stage3.isActive=false;
                patient.stage3.activeDate=null;
                patient.stage3.date=null;
                patient.stage4.isActive=false;
                patient.stage4.activeDate=null;
                patient.stage4.date=null;
            }
            else{
                patient.stage1.isInQueue=false;
                patient.stage1.isGone=false;
                patient.stage2.isActive=false;
                patient.stage2.inTime.isGone=false;
                patient.stage2.outTime.isGone=false;
                patient.stage3.isActive=false;
                patient.stage3.isGone=false;
                patient.stage4.isActive=false;
                patient.stage4.isGone=false;
            }
            patient.save(function(err){
                if(err){
                    console.log(err);
                }
                RegPatient.findOne({"stage3.isGone": true, "stage4.isGone": false}).sort({ _id: 1 }).exec(function(err, oldestPatient){
                    if(oldestPatient!=null){
                        oldestPatient.stage4.isActive=true;
                        oldestPatient.stage4.activeDate=Date.now();
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
            if(patient.visit_type=="emergency"){
                patient.stage1.isInQueue=true;
                patient.stage1.date=null;
                patient.stage1.isGone=false;
                patient.stage2.inTime.date=null;
                patient.stage2.inTime.isGone=false;
                patient.stage2.outTime.date=null;
                patient.stage2.outTime.isGone=false;
                patient.stage2.isActive=false;
                patient.stage3.isActive=false;
                patient.stage3.activeDate=null;
                patient.stage3.date=null;
                patient.stage4.isActive=false;
                patient.stage4.activeDate=null;
                patient.stage4.date=null;
            }
            else{
                patient.stage1.isInQueue=false;
                patient.stage1.isGone=false;
                patient.stage2.isActive=false;
                patient.stage2.inTime.isGone=false;
                patient.stage2.outTime.isGone=false;
                patient.stage3.isActive=false;
                patient.stage3.isGone=false;
                patient.stage4.isActive=false;
                patient.stage4.isGone=false;
            }
            patient.save(function(err){
                if(err){
                    console.log(err);
                }
                res.redirect("/HSE/home");
            });
        }
    });
});


// route to book an appointment

router.post("/bookingconfirm", function(req, res){
    Patient.findById(req.body.pid, function(err, patient){
        if(err){
            req.flash("error", "Invalid Patient Id, Try Again");
            return res.redirect("back");
        }else{
            if(patient==null){
                req.flash("error", "Invalid Patient Id, Try Again");
                return res.redirect("back");
            }else{
                RegPatient.find({"pid": patient._id, "stage1.isInQueue": true},function(err, foundPatients){
                    if(err){
                        req.flash("error", "Something Went Wrong, Try Again.");
                        return res.redirect("back");
                    }else{
                        if(foundPatients.length==0){
                            Appointment.findOne({"pid":req.body.pid}, function(err, foundAppointment){
                                if(err){
                                    req.flash("error", "Something Went Wrong, Try Again");
                                    return res.redirect("back");
                                }
                                if(foundAppointment == null){
                                    DecisionDate.findOne({},function(err, foundDate){
                                        var t = req.body.a_time;
                                        var d = req.body.a_date;
                                        var tArray = t.split(":");
                                        var dArray = d.split("-");
                                        var reqDate = new Date(dArray[0], (Number(dArray[1])-1), dArray[2], tArray[0], tArray[1]).toISOString();
                                        var onlyDay = new Date(dArray[0], (Number(dArray[1])-1), dArray[2]).toISOString();
                                       
                                        Appointment.create({
                                            pid: patient._id,
                                            name: patient.fname + " " + patient.lname,
                                            date: reqDate,
                                            onlyDate: onlyDay,
                                            type: req.body.a_type,
                                            token: foundDate.apt_token,
                                        },function(err, appointment){
                                        });
                                        RegPatient.create({
                                            pid: patient._id,
                                            visit_type: 'appointment',
                                            reason: req.body.a_type,
                                            name: patient.fname + " " + patient.lname,
                                            token: foundDate.apt_token,
                                            stage1: {
                                                isInQueue: true
                                            }
                                        },function(err, regPatient){
                                            if(err){
                                                req.flash("error", "Something Went Wrong, Try Again.");
                                                return res.redirect("back");
                                            }else{
                                                foundDate.apt_token+=1;
                                                foundDate.decisionDate = Date.now();
                                                foundDate.save(function(err){
                                                    req.flash("success", "Appointment booked successfully");
                                                    return res.redirect("/HSE/book-appointments");
                                                });
                                            }
                                        });
                                    });
                                }else{
                                    req.flash("error", "Appointment is already booked");
                                    return res.redirect("back");
                                }
                            });
                        }else{
                            req.flash("error", "Patient is in queue or Appointment is already booked");
                            return res.redirect("back");
                        }
                    }
                });
            }
        }
    });
});

module.exports = router;