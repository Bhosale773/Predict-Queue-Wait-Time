var express               = require("express");
var router                = express.Router();
var middleware            = require("../middleware");
var passport              = require("passport");
var Patient               = require("../models/patient");
var RegPatient            = require("../models/regPatient");
var DecisionDate          = require("../models/date");
var Appointment           = require("../models/appointment");
var token_no;


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
    Appointment.find({}, function(err, foundAppointments){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.");
            return res.redirect("back");
        }else{
            res.render("HSE/appointments", {appointments: foundAppointments});
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
    
    RegPatient.find({}, function(err, foundPatients){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.");
            return res.redirect("back");
        }else{
            res.render("HSE/patient-list", {regPatients: foundPatients, date: p_dateFull});
        }
    });
});


// filter patient data according to date from database

router.post("/filter-patient-list", middleware.isHsePermitted, function(req, res){
    RegPatient.find({}, function(err, foundPatients){
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
                                    if(foundAppointment!=null){
                                        RegPatient.findOne({"pid": patient._id, "stage1.isInQueue": true}, function(err, foundPatient){
                                            if(foundPatient==null){
                                                req.flash("error", "Appointment does not exist");
                                                return res.redirect("back");
                                            }else{
                                                foundPatient.stage1.date=Date.now();
                                                foundPatient.stage1.isGone=true;
                                                foundPatient.save(function(err){
                                                    if(err){
                                                        console.log(err);
                                                    }
                                                    return res.redirect("/HSE/home");
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
                                                    foundDate.save(function(err){
                                                        return res.redirect("/HSE/home");
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

                                    Appointment.findOne({"pid": patient._id}, function(err, foundAppointment){
                                        if(foundAppointment!=null){
                                            Appointment.deleteOne({"_id": foundAppointment._id}, function(err){
                                                if(err){
                                                    console.log(err);
                                                }
                                            });
                                        }
                                    });

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
                                        var reqDate = new Date(dArray[0], dArray[1]-1, dArray[2], tArray[0], tArray[1]);

                                        Appointment.create({
                                            pid: patient._id,
                                            name: patient.fname + " " + patient.lname,
                                            date: reqDate,
                                            type: req.body.a_type,
                                            token: foundDate.apt_token
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