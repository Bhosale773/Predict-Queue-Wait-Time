var express               = require("express");
var router                = express.Router();
var middleware            = require("../middleware");
var bcrypt                = require("bcryptjs");
var Patient               = require("../models/patient");
var RegPatient            = require("../models/regPatient");
var DecisionDate          = require("../models/date");


// route to landing page

router.get("/",function(req, res){
    res.render("landing");
});


// route to login page

router.get("/login", middleware.isLoginPermitted, function(req, res){
    res.render("login");
});


// route to open account of patient in hospital database

router.post("/register", function(req, res){
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


// route to logout patient

router.get("/logout", middleware.isLogoutPermitted, function(req, res){
    if(req.user){
        req.logout();
        req.flash("success", "You have Log Out Successfully.");
    }
    return res.redirect("/");
});


// default route

router.get("*",function(req,res){
    res.send("Invalid url : Page Not Found");
});

module.exports = router;