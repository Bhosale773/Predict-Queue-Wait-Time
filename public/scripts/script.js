// animate eye icon

$(document).ready(function() {
    $("#passinput").on("keyup", function(){
        if($("#passinput").val()){
            $(".eyeicon").removeClass("d-none");
        }else{
            $(".eyeicon").addClass("d-none");
        }
    });
});

// set eye icon function

$(document).ready(function() {
    var time = 0, timeOut = 0;  
    var x = document.getElementById("passinput");
    $("form .eyeicon").on('mousedown touchstart', function(e) {
        x.type = "text"; 
        timeOut = setInterval(function(){
            console.log(time++);
        }, 100);
    }).bind('mouseup mouseleave touchend', function() {
        x.type = "password"; 
        clearInterval(timeOut);
    });
});

// toggle d-none class for sign up quote in login form

$(document).ready(function(){
    $("form select#type").change(function(){
        var type= $(this).children("option:selected").val();
        if(type=="hse"){
            $(".form .quote").addClass("d-none");
        }else{
            $(".form .quote").removeClass("d-none");
        }
    });
});

