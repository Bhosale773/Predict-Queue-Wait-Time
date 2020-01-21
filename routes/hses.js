var express               = require("express");
var router                = express.Router();
var middleware            = require("../middleware");
var passport              = require("passport");
var Patient               = require("../models/patient");
var RegPatient            = require("../models/regPatient");
var DecisionDate          = require("../models/date");
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


// route to retrive and show all patient data from database

router.get("/patient-list", middleware.isHsePermitted, function(req, res){
    RegPatient.find({}, function(err, foundPatients){
        if(err){
            req.flash("error", "Something Went Wrong, Try Again.");
            return res.redirect("back");
        }else{
            res.render("HSE/patient-list", {regPatients: foundPatients});
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

module.exports = router;