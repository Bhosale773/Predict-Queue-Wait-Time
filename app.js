var express               = require("express");
var app                   = express();
var mongoose              = require("mongoose");
var bodyParser            = require("body-parser");

mongoose.connect("mongodb://localhost:27017/pqt_db",{useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({extended: true}));







app.get("/",function(req, res){
    res.render("landing");
});

app.get("/login-using-username",function(req, res){
    res.render("login-using-username");
});

app.get("/login-using-id",function(req, res){
    res.render("login-using-id");
});

app.get("/register",function(req, res){
    res.render("register");
});

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

app.get("/HSE",function(req, res){
    res.render("HSE/home");
});

app.get("/HSE/login",function(req, res){
    res.render("HSE/login");
});

app.get("*",function(req,res){
    res.send("Invalid url : Page Not Found");
});







app.listen(process.env.PORT || 1000, function(){
    console.log("Server started...");
});