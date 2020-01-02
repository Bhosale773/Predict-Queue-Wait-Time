var express               = require("express");
var app                   = express();
var mongoose              = require("mongoose");
var bodyParser            = require("body-parser");
var passport              = require("passport");
var LocalStrategy         = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var flash                 = require("connect-flash");

mongoose.connect("mongodb://localhost:27017/pqt_db",{useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

// database schemas

var hseSchema = new mongoose.Schema({
    username: String,
    password: String
});

var HSE = mongoose.model("HSE", hseSchema);

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    fname: String,
    lname: String,
    contact: String,
    email: String,
    addressl1: String,
    addressl2: String,
    history: [
        historySchema
    ],
    comments: [
        commentSchema
    ]
});

UserSchema.plugin(passportLocalMongoose);

var User = mongoose.model("User", UserSchema);

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

// passport.use("hse-login",new LocalStrategy(HSE.authenticate()));
// passport.serializeUser(HSE.serializeUser());
// passport.deserializeUser(HSE.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});





app.get("/",function(req, res){
    res.render("landing");
});

app.get("/login",function(req, res){
    res.render("login");
});

// app.get("/login-using-id",function(req, res){
//     res.render("login-using-id");
// });

// app.get("/register",function(req, res){
//     res.render("register");
// });

app.get("/patient/dashboard",function(req, res){
    res.render("patient/dashboard");
});

app.get("/patient/profile",function(req, res){
    res.render("patient/profile");
});

app.get("/patient/qr-code",function(req, res){
    res.render("patient/qr-code");
});

app.get("/patient/history",function(req, res){
    res.render("patient/history");
});

// app.get("/HSE",isHSELoggedIn,function(req, res){
//     res.render("HSE/home");
// });

// HSE.find({"username" : "hse"},function(err, hses){
//     if(err){
//         console.log(err);
//     }else{
//         if(hses.length==0){
//             HSE.register(new HSE({username: "hse"}), "hse", function(err, user){
//                 if(err){
//                     console.log(err.message);
//                 }
//             });
//         }
//     }
// });

app.get("/HSE/login",function(req, res){
    res.render("HSE/login");
});

// app.post("/HSE/login",passport.authenticate("local", {
//     successRedirect: "/HSE",
//     failureRedirect: "/HSE/login",
//     successFlash: "You have Sign In successfully.",
//     failureFlash: "Invalid username or password."
// }) ,function(req,res){
// });

// app.get("/HSE/logout", function(req, res){
//     req.logout();
//     req.flash("success", "You have Log Out Successfully.");
//     res.redirect("/HSE/login");
// });

app.get("*",function(req,res){
    res.send("Invalid url : Page Not Found");
});





// Middlewares

// function isHSELoggedIn(req, res, next){
//     if(req.isAuthenticated()){
//         return next();
//     }
//     req.flash("error", "You must be Sign In first.");
//     res.redirect("/HSE/login");
// }



app.listen(process.env.PORT || 1000, function(){
    console.log("Server started...");
});