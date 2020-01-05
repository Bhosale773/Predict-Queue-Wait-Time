// importing packages

var express               = require("express");
var app                   = express();
var mongoose              = require("mongoose");
var bodyParser            = require("body-parser");
var passport              = require("passport");
var LocalStrategy         = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var flash                 = require("connect-flash");
var bcrypt                = require("bcrypt");
var HSE                   = require("./models/hse");
var Patient               = require("./models/patient");


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
    res.render("patient/dashboard");
});

app.get("/patient/profile", isPatientPermitted, function(req, res){
    res.render("patient/profile");
});

app.get("/patient/qr-code", isPatientPermitted, function(req, res){
    res.render("patient/qr-code");
});

app.get("/patient/history", isPatientPermitted, function(req, res){
    res.render("patient/history");
});

app.get("/HSE/home", isHsePermitted, function(req, res){
    res.render("HSE/home");
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
        res.redirect("/");
    }else{
        Patient.find({"username": req.body.username},function(err, patients){
            if(err){
                req.flash("error", "Something Went Wrong, Try Again");
                res.redirect("/");
            }
            if(patients==[]){
                req.flash("error", "Username Already Exists, Try Again");
                res.redirect("/");
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
                                res.redirect("/");
                            }
                            if(req.user){
                                req.flash("success", "Another account created successfully");
                                res.redirect("/");
                            }else{
                                req.flash("success", "Account created successfully, Proceed with login");
                                res.redirect("/login");
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
    res.redirect("/");
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
            res.redirect("back");
        }
    }else{
        req.flash("error", "You must be Sign In first.");
        res.redirect("/login");
    }
}

function isPatientPermitted(req, res, next){
    if(req.isAuthenticated()){
        if(req.user.username!="hse"){
            return next();
        }else{
            req.flash("error", "You dont have permission to do that");
            res.redirect("back");
        }
    }else{
        req.flash("error", "You must be Sign In first.");
        res.redirect("/login");
    }
}

function isLoginPermitted(req, res, next){
    if(!req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You are already login");
    res.redirect("back");
}

function isLogoutPermitted(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You are already log out");
    res.redirect("back");
}


app.listen(process.env.PORT || 1000, function(){
    console.log("Server started...");
});