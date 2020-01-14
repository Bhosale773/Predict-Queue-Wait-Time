var video = document.createElement("video");
var canvasElement = document.getElementById("canvas");
var canvas = canvasElement.getContext("2d");
var loadingMessage = document.getElementById("loadingMessage");
var outputContainer = document.getElementById("output");
var outputMessage = document.getElementById("outputMessage");
var outputData = document.getElementById("outputData");
var currentStream;

function drawLine(begin, end, color) {
  canvas.beginPath();
  canvas.moveTo(begin.x, begin.y);
  canvas.lineTo(end.x, end.y);
  canvas.lineWidth = 4;
  canvas.strokeStyle = color;
  canvas.stroke();
}

function startMediaTracks(){
  // Use facingMode: environment to attemt to get the front camera on phones
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
    video.srcObject = stream;
    currentStream = stream;
    video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
    video.play();
    requestAnimationFrame(tick);
  });
}

function stopMediaTracks(stream) {
  stream.getTracks().forEach(track => {
    track.stop();
  });
}

function getConfirmationModal(data){
  if(data===""){
    $("#patient-id #p_id").focus();
    $('#patient-id #p_id').popover('show');
  }else{
    $("#confirmation-modal #patient_id").val(data);
    $("#confirmation-modal .modal").modal({"aria-hidden":"true"});
    $('#patient-id #p_id').popover('dispose');
  }
}

function getConfirmationModal2(data){
    $("#confirmation-modal2 #patient_id").val(data);
    $("#confirmation-modal2 .modal").modal({"aria-hidden":"true"});
}

$(document).ready(function(){
  $("#select-way select#registration-option").change(function(){
    var way= $(this).children("option:selected").val();
    if(way=="patient-id"){
      if (typeof currentStream !== 'undefined') {
        stopMediaTracks(currentStream);
      }
    }else{
      startMediaTracks();
    }
  });
});

$(document).ready(function(){
  $('#confirmation-modal .modal').on('hidden.bs.modal', function (e) {
    if($("#select-way select#registration-option").children("option:selected").val()==="qr"){
      startMediaTracks();
    }
  });
});

startMediaTracks();

function tick() {
  loadingMessage.innerText = "⌛ Loading Video..."
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    loadingMessage.hidden = true;
    canvasElement.hidden = false;
    outputContainer.hidden = false;
    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
    var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
    var code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    if (code) {
      drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
      drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
      drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
      drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
      outputMessage.hidden = true;
      outputData.parentElement.hidden = false;
      outputData.innerText = code.data;
      console.log(code.data);
      if(code.data!=""){
        getConfirmationModal(code.data);
      }
    } else {
      outputMessage.hidden = false;
      outputData.parentElement.hidden = true;
    }
  }
  if(!code || code.data==""){
    requestAnimationFrame(tick);
  }
}
