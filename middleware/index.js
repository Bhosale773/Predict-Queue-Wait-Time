// create middleware object to store all middlewares

var middlewareObj = {};


// middleware to check hse have permission or not

middlewareObj.isHsePermitted = function(req, res, next){
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


// middleware to check patient have permission or not

middlewareObj.isPatientPermitted = function(req, res, next){
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


// middleware to check login is allowed or not

middlewareObj.isLoginPermitted = function(req, res, next){
    if(!req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You are already login");
    return res.redirect("back");
}


// middleware to check logout is allowed or not

middlewareObj.isLogoutPermitted = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You are already log out");
    return res.redirect("back");
}

module.exports = middlewareObj;