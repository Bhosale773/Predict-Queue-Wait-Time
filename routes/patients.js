var express               = require("express");
var router                = express.Router();
var middleware            = require("../middleware");
var passport              = require("passport");
var Patient               = require("../models/patient");
var RegPatient            = require("../models/regPatient");
var DecisionDate          = require("../models/date");


// route to login patient

router.post("/login",passport.authenticate("patient", {
    successRedirect: "/patient/dashboard",
    failureRedirect: "/login",
    successFlash: "You have Sign In successfully.",
    failureFlash: "Invalid username or password."
}) ,function(req,res){
});


// route to patient's dashboard

router.get("/dashboard", middleware.isPatientPermitted, function(req, res){
    if(req.user){
        RegPatient.findOne({"pid": req.user._id, "stage1.isInQueue": true}, function(err, foundHistory){
            res.render("patient/dashboard", {currentUserStatus: foundHistory});
        });
    }else{
        res.render("patient/dashboard", {currentUserStatus: null});
    }
});


// route to patient's profile

router.get("/profile", middleware.isPatientPermitted, function(req, res){
    res.render("patient/profile");
});


// route to patient's unique qr code

router.get("/qr-code", middleware.isPatientPermitted, function(req, res){
    res.render("patient/qr-code");
});


// route to patient's history

router.get("/history", middleware.isPatientPermitted, function(req, res){
    if(req.user){
        RegPatient.find({"pid": req.user._id}, function(err, foundHistory){
            res.render("patient/history", {foundHistory: foundHistory});
        });
    }else{
        res.render("patient/history", {foundHistory: []});
    }
});

module.exports = router;