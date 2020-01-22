var Patient               = require("./models/patient");
var RegPatient            = require("./models/regPatient");


function calculate(patient, patientStatus){
    var currentUserStatus = {};

    if(patientStatus!=null){
        currentUserStatus.name = patientStatus.name;
        currentUserStatus.token = patientStatus.token;
        currentUserStatus.registrationTime = patientStatus.stage1.date;
        currentUserStatus.consultationInTime = patientStatus.stage2.inTime.date;
        currentUserStatus.consultationOutTime = patientStatus.stage2.outTime.date;
        currentUserStatus.billingInTime = patientStatus.stage2.outTime.date;
        currentUserStatus.billingOutTime = patientStatus.stage3.date;
        currentUserStatus.medicineInTime = patientStatus.stage3.date;
        currentUserStatus.medicineOutTime = patientStatus.stage4.date;







        currentUserStatus.registrationTime = patientStatus.stage1.date.toString();

        if(currentUserStatus.consultationInTime != null){
            currentUserStatus.consultationInTime = currentUserStatus.consultationInTime.toString();
        }else{
            currentUserStatus.consultationInTime = "Not Available";
        }

        if(currentUserStatus.consultationOutTime != null){
            currentUserStatus.consultationOutTime = currentUserStatus.consultationOutTime.toString();
            currentUserStatus.billingInTime = currentUserStatus.billingInTime.toString();
        }else{
            currentUserStatus.consultationOutTime = "Not Available";
            currentUserStatus.billingInTime = "Not Available";
        }

        if(currentUserStatus.billingOutTime != null){
            currentUserStatus.billingOutTime = currentUserStatus.billingOutTime.toString();
            currentUserStatus.medicineInTime = currentUserStatus.medicineInTime.toString();
        }else{
            currentUserStatus.billingOutTime = "Not Available";
            currentUserStatus.medicineInTime = "Not Available";
        }

        if(currentUserStatus.medicineOutTime != null){
            currentUserStatus.medicineOutTime = currentUserStatus.medicineOutTime.toString();
        }else{
            currentUserStatus.medicineOutTime = "Not Available";
        }

        

    }else{
        currentUserStatus = null;
    }

    return currentUserStatus;
}

module.exports = calculate;