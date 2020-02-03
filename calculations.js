var Patient               = require("./models/patient");
var RegPatient            = require("./models/regPatient");
var AlgoData              = require("./models/algoData");
var timespan              = require("timespan");



async function calculate(patient, patientStatus){
    
    //intialize algo data
    await AlgoData.find({},function(err, algoDatas){
        if(err){
            console.log(err);
        }else{
            if(algoDatas.length==0){
                AlgoData.create({key : 1},function(err,f){});
            
            }
        }
    });
    var algoData;
    await AlgoData.findOne({},function(err, foundOne){
        if(err){
            console.log(err);
        }else{
            algoData = foundOne;
        }
    })

    currentUserStatus = {};

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
        currentUserStatus.consultAhead = 0;
        currentUserStatus.mediAhead = 0;
        currentUserStatus.billAhead = 0;
        currentUserStatus.consultAvg = 0;
        currentUserStatus.billAvg = 0;
        currentUserStatus.mediAvg = 0;


        //preet
        //patients ahead in consultation
        await RegPatient.countDocuments({"stage1.isInQueue" : true, "stage2.outTime.isGone" : false , "stage1.date":{$lt : patientStatus.stage1.date}},async function(err,count){
            currentUserStatus.consultAhead= count;
            currentUserStatus.consultAvg = count * algoData.consultAvg;
            await RegPatient.findOne({"stage2.isActive" : true,"stage1.isInQueue":true,"stage2.outTime.isGone" : false},async function(err, foundOne){
                if(foundOne){
                    var currentDate = new Date(Date.now());
                    var ts = timespan.fromDates(foundOne.stage2.inTime.date,currentDate,true);
                    var sec = ts.totalSeconds();
                    if(sec<algoData.consultAvg){
                        currentUserStatus.consultAvg = currentUserStatus.consultAvg - sec;
                    }
                    else{
                        currentUserStatus.consultAvg = currentUserStatus.consultAvg - algoData.consultAvg;
                    }
                    
                }
            });
            if(currentUserStatus.consultAvg<60){
                        currentUserStatus.consultAvg = 60;
            }
            
        });
        //patients ahead in billing
        await RegPatient.countDocuments({"stage1.isInQueue" : true, "stage2.outTime.isGone" : true , "stage3.isGone" : false, "stage1.date":{$lt : patientStatus.stage1.date}},function(err,count){
            currentUserStatus.billAhead= count;
            currentUserStatus.billAvg = count * algoData.billAvg;
        });
        //patients ahead in medicine
        await RegPatient.countDocuments({"stage1.isInQueue" : true, "stage3.isGone" : true, "stage4.isGone" : false, "stage1.date":{$lt : patientStatus.stage1.date}},function(err,count){
            currentUserStatus.mediAhead= count;
            currentUserStatus.mediAvg = count * algoData.mediAvg;
        });

        if(currentUserStatus.registrationTime != null){
            currentUserStatus.registrationTime = currentUserStatus.registrationTime.toString();
        }else{
            currentUserStatus.registrationTime = "Not Available";
        }

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