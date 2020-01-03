// animate eye icon

$(document).ready(function() {
    $("#passinput1").on("keyup", function(){
        if($("#passinput1").val()){
            $(".form1 .eyeicon").removeClass("d-none");
        }else{
            $(".form1 .eyeicon").addClass("d-none");
        }
    });
    $("#passinput2").on("keyup", function(){
        if($("#passinput2").val()){
            $(".form2 .eyeicon").removeClass("d-none");
        }else{
            $(".form2 .eyeicon").addClass("d-none");
        }
    });
});

// set eye icon function

$(document).ready(function() {
    var time = 0, timeOut = 0;  
    var x = document.getElementById("passinput1");
    var y = document.getElementById("passinput2");
    $("form .eyeicon").on('mousedown touchstart', function(e) {
        x.type = "text"; 
        y.type = "text"; 
        timeOut = setInterval(function(){
            console.log(time++);
        }, 100);
    }).bind('mouseup mouseleave touchend', function() {
        x.type = "password"; 
        y.type = "password"; 
        clearInterval(timeOut);
    });
});

// toggle d-none class for sign up quote in login form

$(document).ready(function(){
    $(".form select#type").change(function(){
        var type= $(this).children("option:selected").val();
        if(type=="hse"){
            $(".form .form1").addClass("d-none");
            $(".form .form2").removeClass("d-none");
            $(".form .quote").addClass("d-none");
        }else{
            $(".form .form1").removeClass("d-none");
            $(".form .form2").addClass("d-none");
            $(".form .quote").removeClass("d-none");
        }
    });
});

